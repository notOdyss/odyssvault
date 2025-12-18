//
//  OdyssVaultApp.swift
//  OdyssVault
//
//  Obsidian-inspired note-taking app with cloud sync
//

import SwiftUI

@main
struct OdyssVaultApp: App {
    @StateObject private var authService = AuthService.shared
    @StateObject private var syncEngine = SyncEngine.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .environmentObject(syncEngine)
                .task {
                    // Check auth after UI loads, not before
                    await authService.checkAuth()
                }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var syncEngine: SyncEngine

    var body: some View {
        Group {
            if authService.isLoading {
                // Show loading while checking auth
                print("📱 Showing: LoadingView (isLoading=true)")
                LoadingView()
            } else if authService.isAuthenticated {
                print("📱 Showing: MainView (authenticated)")
                MainView()
                    .task {
                        // Start sync only after authenticated
                        syncEngine.startSync()
                    }
            } else {
                print("📱 Showing: LoginView (not authenticated)")
                LoginView()
            }
        }
        .onAppear {
            print("📱 ContentView appeared")
            print("   isLoading: \(authService.isLoading)")
            print("   isAuthenticated: \(authService.isAuthenticated)")
        }
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()

            VStack(spacing: 20) {
                // Simple loading icon
                Image(systemName: "note.text")
                    .font(.system(size: 50, weight: .light))
                    .foregroundColor(.purple)

                Text("OdyssVault")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .purple))
                    .scaleEffect(1.5)
                    .padding(.top)

                Text("Loading...")
                    .foregroundColor(.white)
                    .padding(.top)
            }
        }
        .onAppear {
            print("🎨 LoadingView appeared")
        }
    }
}
