//
//  MainView.swift
//  OdyssVault
//
//  Main navigation view with sidebar and note list
//

import SwiftUI

struct MainView: View {
    @EnvironmentObject var syncEngine: SyncEngine
    @EnvironmentObject var authService: AuthService
    @State private var selectedNoteId: Int?
    @State private var showingCreateNote = false
    @State private var showingCreateFolder = false
    @State private var selectedFolder: Int?
    @State private var searchText = ""

    var body: some View {
        NavigationSplitView {
            // Sidebar
            List(selection: $selectedFolder) {
                // All notes section
                Section {
                    NavigationLink(value: nil as Int?) {
                        Label("All Notes", systemImage: "note.text")
                    }
                    .tag(nil as Int?)
                }

                // Folders section
                if !syncEngine.folders.isEmpty {
                    Section("Folders") {
                        ForEach(syncEngine.folders) { folder in
                            NavigationLink(value: folder.id) {
                                Label(folder.name, systemImage: "folder.fill")
                            }
                            .tag(folder.id as Int?)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    deleteFolder(folder.id)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("OdyssVault")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingCreateNote = true }) {
                            Label("New Note", systemImage: "doc.badge.plus")
                        }

                        Button(action: { showingCreateFolder = true }) {
                            Label("New Folder", systemImage: "folder.badge.plus")
                        }

                        Divider()

                        Button(role: .destructive, action: { authService.logout() }) {
                            Label("Logout", systemImage: "arrow.right.square")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .refreshable {
                await syncEngine.fullSync()
            }
        } content: {
            // Note list
            NoteListView(
                folderId: selectedFolder,
                selectedNoteId: $selectedNoteId
            )
        } detail: {
            // Note editor or error message
            if let error = syncEngine.error {
                VStack(spacing: 20) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.yellow)

                    Text("Connection Error")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    Button(action: {
                        Task {
                            await syncEngine.fullSync()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                            Text("Retry Connection")
                        }
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }

                    Text("Make sure the backend server is running:\nuvicorn main:app --reload --host 0.0.0.0")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.top)
                }
                .padding()
            } else if let noteId = selectedNoteId {
                NoteEditorView(noteId: noteId)
            } else {
                ContentUnavailableView(
                    "No Note Selected",
                    systemImage: "doc.text",
                    description: Text("Select a note from the list or create a new one")
                )
            }
        }
        .sheet(isPresented: $showingCreateNote) {
            CreateNoteSheet(folderId: selectedFolder)
        }
        .sheet(isPresented: $showingCreateFolder) {
            CreateFolderSheet()
        }
    }

    private func deleteFolder(_ id: Int) {
        Task {
            do {
                try await syncEngine.deleteFolder(id)
            } catch {
                print("Failed to delete folder: \(error)")
            }
        }
    }
}

#Preview {
    MainView()
        .environmentObject(SyncEngine.shared)
        .environmentObject(AuthService.shared)
}
