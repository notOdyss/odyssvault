# OdyssVault iOS - Complete File Structure

```
📱 OdyssVault iOS App
│
├── 📄 README.md                          ← Complete documentation
├── 📄 QUICKSTART.md                      ← 5-minute setup guide
├── 📄 FILE_STRUCTURE.md                  ← This file
│
└── 📁 OdyssVault/                        ← Main app directory
    │
    ├── 📄 OdyssVaultApp.swift            ← App entry point (@main)
    │   ├── AuthService integration
    │   ├── SyncEngine integration
    │   └── Routes to LoginView or MainView
    │
    ├── ⚙️ App Configuration (in Xcode)    ← Not a file!
    │   ├── Bundle identifier
    │   ├── Display name
    │   ├── Permissions
    │   └── Network security (Allow HTTP)
    │   Note: Modern iOS apps don't need Info.plist
    │
    ├── 📁 Models/                        ← Data models (match backend)
    │   ├── 📄 User.swift
    │   │   ├── User struct
    │   │   ├── LoginRequest
    │   │   ├── RegisterRequest
    │   │   └── AuthResponse
    │   │
    │   ├── 📄 Note.swift
    │   │   ├── Note struct (with Codable)
    │   │   ├── CreateNoteRequest
    │   │   └── UpdateNoteRequest
    │   │
    │   ├── 📄 Folder.swift
    │   │   ├── Folder struct
    │   │   └── CreateFolderRequest
    │   │
    │   └── 📄 Vault.swift
    │       ├── Vault struct
    │       └── CreateVaultRequest
    │
    ├── 📁 Services/                      ← Business logic & networking
    │   ├── 📄 APIClient.swift            ← Network layer (singleton)
    │   │   ├── baseURL configuration
    │   │   ├── JWT token management
    │   │   ├── Generic request method
    │   │   ├── Auth endpoints
    │   │   ├── Vault endpoints
    │   │   ├── Note endpoints
    │   │   └── Folder endpoints
    │   │
    │   ├── 📄 AuthService.swift          ← Authentication manager
    │   │   ├── @Published user state
    │   │   ├── Login/Register/Guest
    │   │   ├── Logout
    │   │   └── Token persistence
    │   │
    │   └── 📄 SyncEngine.swift           ← Sync orchestrator
    │       ├── @Published notes array
    │       ├── @Published folders array
    │       ├── @Published vaults array
    │       ├── Auto-sync timer (30s)
    │       ├── Full sync method
    │       ├── CRUD operations
    │       └── Real-time updates
    │
    └── 📁 Views/                         ← SwiftUI user interface
        ├── 📄 LoginView.swift            ← Authentication screen
        │   ├── Login form
        │   ├── Register form
        │   ├── Guest login button
        │   └── Error handling
        │
        ├── 📄 MainView.swift             ← Main navigation
        │   ├── NavigationSplitView (3 columns)
        │   ├── Sidebar (folders)
        │   ├── Note list (middle)
        │   ├── Note editor (detail)
        │   ├── Create note/folder buttons
        │   └── Logout menu
        │
        ├── 📄 NoteListView.swift         ← Notes list view
        │   ├── List of notes
        │   ├── Search bar
        │   ├── Filter by folder
        │   ├── Swipe to delete
        │   └── Empty state
        │
        ├── 📄 NoteEditorView.swift       ← Markdown editor
        │   ├── Title text field
        │   ├── Content text editor
        │   ├── Edit/Preview toggle
        │   ├── Markdown rendering
        │   ├── Auto-save (1s debounce)
        │   └── Sync indicator
        │
        └── 📄 CreateNoteSheet.swift      ← Creation modals
            ├── CreateNoteSheet
            │   ├── Title input
            │   ├── Folder selector
            │   └── Create button
            └── CreateFolderSheet
                ├── Name input
                └── Create button
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         iOS App                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐      ┌──────────────┐      ┌────────────┐ │
│  │  Views     │ ───▶ │  Services    │ ───▶ │ APIClient  │ │
│  │  (SwiftUI) │      │  (ObservableObject)  │ (Network)  │ │
│  └────────────┘      └──────────────┘      └────────────┘ │
│       ▲                     ▲                     │         │
│       │                     │                     │         │
│       │         @Published State                  │         │
│       └─────────────────────┘                     │         │
│                                                    │         │
└────────────────────────────────────────────────────┼─────────┘
                                                     │
                                                HTTP │ (JSON)
                                                     │
┌────────────────────────────────────────────────────┼─────────┐
│                    FastAPI Backend                 │         │
├────────────────────────────────────────────────────┼─────────┤
│                                                    ▼         │
│  ┌──────────┐      ┌──────────┐      ┌──────────────────┐ │
│  │ Routes   │ ───▶ │ Database │ ───▶ │   PostgreSQL     │ │
│  │ (API)    │      │ (SQLAlch)│      │   (Storage)      │ │
│  └──────────┘      └──────────┘      └──────────────────┘ │
│       ▲                                                    │ │
└───────┼────────────────────────────────────────────────────┘
        │
        │ HTTP (JSON)
        │
┌───────┼────────────────────────────────────────────────────┐
│       │                Web Frontend                        │
├───────┼────────────────────────────────────────────────────┤
│       ▼                                                     │
│  ┌──────────┐      ┌──────────┐      ┌──────────────────┐ │
│  │ React    │ ───▶ │ Zustand  │ ───▶ │   API Client     │ │
│  │ (UI)     │      │ (State)  │      │   (fetch)        │ │
│  └──────────┘      └──────────┘      └──────────────────┘ │
│                                                            │ │
└────────────────────────────────────────────────────────────┘
```

## Key Files Explained

### OdyssVaultApp.swift
**Purpose:** App entry point
**Key Features:**
- Switches between LoginView and MainView based on auth state
- Initializes environment objects (AuthService, SyncEngine)
- Starts automatic sync on app launch

### Models/*.swift
**Purpose:** Data structures matching backend schema
**Key Features:**
- Codable for JSON encoding/decoding
- Snake_case ↔ camelCase mapping
- ISO8601 date handling
- Identifiable for SwiftUI Lists

### Services/APIClient.swift
**Purpose:** Network communication with backend
**Key Features:**
- Singleton pattern for shared instance
- JWT token management
- Generic async/await request method
- Error handling and HTTP status codes
- Configurable baseURL for device testing

### Services/AuthService.swift
**Purpose:** Authentication state management
**Key Features:**
- ObservableObject for SwiftUI reactivity
- @Published properties trigger UI updates
- Token persistence in UserDefaults
- Login/Register/Guest/Logout methods

### Services/SyncEngine.swift
**Purpose:** Data synchronization orchestrator
**Key Features:**
- Timer-based auto-sync (every 30 seconds)
- In-memory data cache (@Published arrays)
- CRUD operations with instant UI updates
- Vault switching support
- Background sync on app state changes

### Views/LoginView.swift
**Purpose:** Authentication UI
**Key Features:**
- Toggle between login/register modes
- Form validation
- Guest mode support
- Loading states
- Error display

### Views/MainView.swift
**Purpose:** Main app navigation structure
**Key Features:**
- 3-column NavigationSplitView (iPad)
- Adaptive layout (iPhone)
- Sidebar with folders
- Middle column with notes
- Detail column with editor
- Pull-to-refresh
- Context menus

### Views/NoteEditorView.swift
**Purpose:** Markdown note editing
**Key Features:**
- Real-time markdown preview
- Auto-save with 1-second debounce
- Edit/Preview mode toggle
- Sync status indicator
- Title and content editing

## Sync Mechanism

### How It Works

1. **App Launch**
   - SyncEngine.startSync() called
   - Initial fullSync() fetches all data
   - Timer starts for periodic sync

2. **Periodic Sync** (every 30s)
   - Fetches latest data from backend
   - Updates @Published arrays
   - SwiftUI views auto-update

3. **User Actions**
   - Create/Update/Delete operations
   - Immediately call API
   - Update local state
   - Next sync validates consistency

4. **Vault Switching**
   - Changes activeVaultId
   - Triggers fullSync()
   - Loads notes/folders for new vault

### Sync Flow Diagram

```
┌─────────────┐
│   Timer     │ Every 30s
│  (30 sec)   │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  fullSync()      │
└──────┬───────────┘
       │
       ├──▶ Fetch vaults
       ├──▶ Fetch notes (active vault)
       └──▶ Fetch folders (active vault)
       │
       ▼
┌──────────────────┐
│ Update @Published│
│     arrays       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  SwiftUI Views   │
│  Auto-refresh    │
└──────────────────┘
```

## Dependencies

### Zero External Dependencies! 🎉

The app uses **only built-in iOS frameworks**:
- `SwiftUI` - UI framework
- `Foundation` - Core utilities
- `Combine` - Reactive programming (for @Published)

**No third-party packages needed!** This makes the app:
- ✅ Faster to build
- ✅ More secure
- ✅ Easier to maintain
- ✅ No version conflicts

Markdown rendering uses iOS 15+ built-in `AttributedString` markdown support.

## Configuration Points

### Change Backend URL
**File:** `Services/APIClient.swift`
**Line:** 28
```swift
private let baseURL = "http://localhost:8000"          // Simulator
private let baseURL = "http://192.168.1.100:8000"      // Device
```

### Change Sync Interval
**File:** `Services/SyncEngine.swift`
**Line:** 18
```swift
private let syncInterval: TimeInterval = 30  // seconds
```

### Change App Name
**File:** `Info.plist`
```xml
<key>CFBundleDisplayName</key>
<string>OdyssVault</string>
```

### Change Bundle ID
**Xcode:** Project Settings → General → Bundle Identifier
```
com.yourname.OdyssVault
```

## Build Targets

The app supports:
- **iOS 17.0+** (iPhone)
- **iPadOS 17.0+** (iPad optimized)
- **Simulator** (any iOS 17+ simulator)

## Total Lines of Code

- **Models:** ~150 lines
- **Services:** ~450 lines
- **Views:** ~550 lines
- **Total:** ~1,150 lines of Swift

Compact, focused, production-ready code! 🚀
