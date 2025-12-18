//
//  NoteEditorView.swift
//  OdyssVault
//
//  Markdown editor with live preview
//

import SwiftUI

struct NoteEditorView: View {
    @EnvironmentObject var syncEngine: SyncEngine
    let noteId: Int

    @State private var title: String = ""
    @State private var content: String = ""
    @State private var showPreview = false
    @State private var saveTask: Task<Void, Never>?

    var note: Note? {
        syncEngine.getNote(by: noteId)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Title editor
            TextField("Note Title", text: $title, axis: .vertical)
                .font(.title2)
                .fontWeight(.bold)
                .padding()
                .onChange(of: title) { _, newValue in
                    scheduleAutoSave()
                }

            Divider()

            // Editor/Preview toggle
            Picker("Mode", selection: $showPreview) {
                Text("Edit").tag(false)
                Text("Preview").tag(true)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            // Content editor or preview
            if showPreview {
                ScrollView {
                    Text(content.markdown)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                }
            } else {
                TextEditor(text: $content)
                    .font(.body)
                    .padding(8)
                    .onChange(of: content) { _, newValue in
                        scheduleAutoSave()
                    }
            }
        }
        .navigationTitle("Edit Note")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack {
                    if syncEngine.isSyncing {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                    }

                    Button(action: { showPreview.toggle() }) {
                        Image(systemName: showPreview ? "pencil" : "eye")
                    }
                }
            }
        }
        .onAppear {
            loadNote()
        }
        .onDisappear {
            saveNote()
        }
    }

    private func loadNote() {
        guard let note = note else { return }
        title = note.title
        content = note.content
    }

    private func scheduleAutoSave() {
        saveTask?.cancel()
        saveTask = Task {
            try? await Task.sleep(for: .seconds(1))
            if !Task.isCancelled {
                saveNote()
            }
        }
    }

    private func saveNote() {
        guard let note = note,
              (note.title != title || note.content != content) else {
            return
        }

        Task {
            do {
                try await syncEngine.updateNote(
                    noteId,
                    title: title,
                    content: content
                )
            } catch {
                print("Failed to save note: \(error)")
            }
        }
    }
}

// Simple markdown rendering view
// For production, use swift-markdown-ui package
extension String {
    var markdown: AttributedString {
        do {
            return try AttributedString(markdown: self)
        } catch {
            return AttributedString(self)
        }
    }
}
