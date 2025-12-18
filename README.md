# Odyss Notes

A simple markdown notes app with wiki-style linking, kind of inspired by Obsidian. Uses `.od` extension for notes.

## What's inside

- Basic markdown editor with live preview
- Link notes together using `[[Note Name]]` syntax
- Graph view to see connections between notes
- Folders for organization
- Multiple vaults (up to 3)
- Version history for notes
- A few color themes

## Quick start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs on `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

## Stack

**Backend**: FastAPI, SQLite, SQLAlchemy
**Frontend**: React, Vite

## Features

### Notes & Linking

Write markdown and link notes together:
```markdown
Check out my thoughts on [[Project Ideas]] and [[Task Management]].
```

Links show up blue if the note exists, red if it doesn't. Click to navigate.

### Graph View

See all your notes connected. Drag nodes around, click to open.

### Folders

Organize notes into folders. Drag and drop works.

### Vaults

Keep separate collections of notes. Max 3 vaults per account.

### Versions

Every time you edit a note, the old version gets saved. Can restore from history.

## Auth

Basic email/password registration or use guest mode (doesn't persist after logout).

## License

MIT
