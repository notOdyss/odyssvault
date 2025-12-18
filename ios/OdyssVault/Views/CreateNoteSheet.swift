//
//  CreateNoteSheet.swift
//  OdyssVault
//
//  Sheet for creating a new note
//

import SwiftUI

struct CreateNoteSheet: View {
    @EnvironmentObject var syncEngine: SyncEngine
    @Environment(\.dismiss) var dismiss

    let folderId: Int?
    @State private var title = ""
    @State private var isCreating = false

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Note Title", text: $title)
                } header: {
                    Text("Title")
                }

                if let folderId = folderId,
                   let folder = syncEngine.folders.first(where: { $0.id == folderId }) {
                    Section {
                        HStack {
                            Image(systemName: "folder.fill")
                                .foregroundColor(.accentColor)
                            Text(folder.name)
                        }
                    } header: {
                        Text("Folder")
                    }
                }
            }
            .navigationTitle("New Note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createNote()
                    }
                    .disabled(title.isEmpty || isCreating)
                }
            }
        }
    }

    private func createNote() {
        isCreating = true

        Task {
            do {
                try await syncEngine.createNote(
                    title: title,
                    content: "",
                    folderId: folderId
                )
                dismiss()
            } catch {
                print("Failed to create note: \(error)")
                isCreating = false
            }
        }
    }
}

struct CreateFolderSheet: View {
    @EnvironmentObject var syncEngine: SyncEngine
    @Environment(\.dismiss) var dismiss

    @State private var name = ""
    @State private var isCreating = false

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Folder Name", text: $name)
                } header: {
                    Text("Name")
                }
            }
            .navigationTitle("New Folder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createFolder()
                    }
                    .disabled(name.isEmpty || isCreating)
                }
            }
        }
    }

    private func createFolder() {
        isCreating = true

        Task {
            do {
                try await syncEngine.createFolder(name: name)
                dismiss()
            } catch {
                print("Failed to create folder: \(error)")
                isCreating = false
            }
        }
    }
}
