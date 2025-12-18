//
//  AuthService.swift
//  OdyssVault
//
//  Manages authentication state and user session
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var user: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: String?

    private let apiClient = APIClient.shared
    private var hasCheckedAuth = false

    private init() {
        // Don't check auth here - it blocks UI initialization
        // Check auth after app loads
    }

    func checkAuth() async {
        // Only check once
        guard !hasCheckedAuth else { return }
        hasCheckedAuth = true

        isLoading = true
        defer { isLoading = false }

        do {
            let user = try await apiClient.getCurrentUser()
            self.user = user
            self.isAuthenticated = true
            print("✅ Auth check: User is authenticated")
        } catch {
            self.isAuthenticated = false
            self.user = nil
            print("ℹ️ Auth check: No existing session")
        }
    }

    func login(username: String, password: String) async {
        isLoading = true
        error = nil

        do {
            let response = try await apiClient.login(username: username, password: password)
            await MainActor.run {
                self.user = response.user
                self.isAuthenticated = true
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func register(username: String, email: String, password: String) async {
        isLoading = true
        error = nil

        do {
            let response = try await apiClient.register(username: username, email: email, password: password)
            await MainActor.run {
                self.user = response.user
                self.isAuthenticated = true
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func guestLogin() async {
        isLoading = true
        error = nil

        do {
            let response = try await apiClient.guestLogin()
            await MainActor.run {
                self.user = response.user
                self.isAuthenticated = true
                self.isLoading = false
                self.error = nil
            }
            print("✅ Guest login completed successfully")
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
            print("❌ Guest login failed: \(error)")
        }
    }

    func logout() {
        apiClient.logout()
        self.user = nil
        self.isAuthenticated = false
        SyncEngine.shared.stopSync()
    }
}
