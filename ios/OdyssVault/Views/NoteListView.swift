//
//  NoteListView.swift
//  OdyssVault
//
//  List of notes with search and filtering
//

import SwiftUI

struct NoteListView: View {
    @EnvironmentObject var syncEngine: SyncEngine
    let folderId: Int?
    @Binding var selectedNoteId: Int?
    @State private var searchText = ""

    var filteredNotes: [Note] {
        let notes = syncEngine.getNotesForFolder(folderId)

        if searchText.isEmpty {
            return notes
        } else {
            return notes.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.content.localizedCaseInsensitiveContains(searchText)
            }
        }
    }

    var body: some View {
        List(filteredNotes, selection: $selectedNoteId) { note in
            NavigationLink(value: note.id) {
                NoteRowView(note: note)
            }
            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                Button(role: .destructive) {
                    deleteNote(note.id)
                } label: {
                    Label("Delete", systemImage: "trash")
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search notes")
        .navigationTitle(folderId == nil ? "All Notes" : folderName)
        .overlay {
            if filteredNotes.isEmpty {
                ContentUnavailableView(
                    searchText.isEmpty ? "No Notes" : "No Results",
                    systemImage: searchText.isEmpty ? "doc.text" : "magnifyingglass",
                    description: Text(searchText.isEmpty ? "Create your first note" : "No notes match your search")
                )
            }
        }
    }

    private var folderName: String {
        guard let folderId = folderId,
              let folder = syncEngine.folders.first(where: { $0.id == folderId }) else {
            return "All Notes"
        }
        return folder.name
    }

    private func deleteNote(_ id: Int) {
        Task {
            do {
                try await syncEngine.deleteNote(id)
                if selectedNoteId == id {
                    selectedNoteId = nil
                }
            } catch {
                print("Failed to delete note: \(error)")
            }
        }
    }
}

struct NoteRowView: View {
    let note: Note

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(note.title)
                .font(.headline)
                .lineLimit(1)

            if !note.content.isEmpty {
                Text(note.content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            Text(note.updatedAt.formatted(date: .abbreviated, time: .shortened))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}
