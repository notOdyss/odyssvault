//
//  SyncEngine.swift
//  OdyssVault
//
//  Handles synchronization between local storage and backend
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class SyncEngine: ObservableObject {
    static let shared = SyncEngine()

    @Published var notes: [Note] = []
    @Published var folders: [Folder] = []
    @Published var vaults: [Vault] = []
    @Published var activeVaultId: Int?
    @Published var isSyncing = false
    @Published var lastSyncTime: Date?
    @Published var error: String?

    private let apiClient = APIClient.shared
    private var syncTimer: Timer?
    private let syncInterval: TimeInterval = 30 // Sync every 30 seconds

    private init() {}

    // MARK: - Sync Control

    func startSync() {
        guard syncTimer == nil else { return }

        print("🔄 Starting sync engine...")

        // Initial sync - delay slightly to let UI render
        Task {
            try? await Task.sleep(for: .seconds(0.5))
            await fullSync()
        }

        // Setup periodic sync
        syncTimer = Timer.scheduledTimer(withTimeInterval: syncInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.fullSync()
            }
        }
    }

    func stopSync() {
        syncTimer?.invalidate()
        syncTimer = nil
        notes = []
        folders = []
        vaults = []
        activeVaultId = nil
    }

    func fullSync() async {
        guard !isSyncing else { return }

        isSyncing = true
        error = nil
        defer { isSyncing = false }

        do {
            // Sync vaults
            vaults = try await apiClient.getVaults()

            // Set active vault if needed
            if activeVaultId == nil, let firstVault = vaults.first {
                activeVaultId = firstVault.id
            }

            // Sync notes and folders for active vault
            if let vaultId = activeVaultId {
                try await syncVaultData(vaultId: vaultId)
            }

            lastSyncTime = Date()
            error = nil  // Clear any previous errors on success
        } catch {
            let errorMessage = error.localizedDescription
            print("⚠️ Sync failed: \(errorMessage)")
            self.error = errorMessage

            // Don't crash - just log and continue
            // App can still work offline with cached data
        }
    }

    func syncVaultData(vaultId: Int) async throws {
        async let notesTask = apiClient.getNotes(vaultId: vaultId)
        async let foldersTask = apiClient.getFolders(vaultId: vaultId)

        notes = try await notesTask
        folders = try await foldersTask
    }

    // MARK: - Vault Operations

    func createVault(name: String) async throws {
        let vault = try await apiClient.createVault(name: name)
        vaults.append(vault)
        activeVaultId = vault.id
        await fullSync()
    }

    func deleteVault(_ id: Int) async throws {
        try await apiClient.deleteVault(id)
        vaults.removeAll { $0.id == id }
        if activeVaultId == id {
            activeVaultId = vaults.first?.id
            await fullSync()
        }
    }

    func switchVault(_ vaultId: Int) async {
        activeVaultId = vaultId
        await fullSync()
    }

    // MARK: - Note Operations

    func createNote(title: String, content: String = "", folderId: Int? = nil) async throws {
        guard let vaultId = activeVaultId else { return }

        let note = try await apiClient.createNote(
            title: title,
            content: content,
            vaultId: vaultId,
            folderId: folderId
        )
        notes.append(note)
    }

    func updateNote(_ id: Int, title: String? = nil, content: String? = nil, folderId: Int? = nil) async throws {
        let updatedNote = try await apiClient.updateNote(id, title: title, content: content, folderId: folderId)

        if let index = notes.firstIndex(where: { $0.id == id }) {
            notes[index] = updatedNote
        }
    }

    func deleteNote(_ id: Int) async throws {
        try await apiClient.deleteNote(id)
        notes.removeAll { $0.id == id }
    }

    // MARK: - Folder Operations

    func createFolder(name: String) async throws {
        guard let vaultId = activeVaultId else { return }

        let folder = try await apiClient.createFolder(name: name, vaultId: vaultId)
        folders.append(folder)
    }

    func deleteFolder(_ id: Int) async throws {
        try await apiClient.deleteFolder(id)
        folders.removeAll { $0.id == id }
        // Move notes from deleted folder to root
        for index in notes.indices where notes[index].folderId == id {
            notes[index].folderId = nil
        }
    }

    // MARK: - Helpers

    func getNotesForFolder(_ folderId: Int?) -> [Note] {
        notes.filter { $0.folderId == folderId }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    func getNote(by id: Int) -> Note? {
        notes.first { $0.id == id }
    }
}
