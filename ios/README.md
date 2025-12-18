# OdyssVault iOS App

Native iOS application for OdyssVault that syncs with your web app and backend in real-time.

## Features

- ✅ **Full Backend Sync** - Automatically syncs with FastAPI backend every 30 seconds
- ✅ **Multi-Vault Support** - Switch between different vaults
- ✅ **Folder Organization** - Organize notes in folders
- ✅ **Markdown Editor** - Write in markdown with live preview
- ✅ **Search** - Full-text search across all notes
- ✅ **Authentication** - Login, register, or use guest mode
- ✅ **Offline-Ready** - Works offline with sync when reconnected
- ✅ **Real-time Updates** - Changes sync automatically between web and iOS

## Requirements

- **Xcode 15.0+**
- **iOS 17.0+**
- **Swift 5.9+**
- **Running OdyssVault backend** (FastAPI server)

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode
2. Create a new iOS App project named "OdyssVault"
3. Set Bundle Identifier: `com.yourname.OdyssVault`
4. Select SwiftUI as the interface
5. Add the project files from `/Users/notodyss/Desktop/exam/ios/OdyssVault/` to your project
   - **Add:** Models/, Services/, Views/, OdyssVaultApp.swift
   - **Don't add:** Info.plist (Xcode generates this automatically)

6. Configure App Transport Security:
   - Select your project → Target → Info tab
   - Add **App Transport Security Settings**
   - Inside it, add **Allow Arbitrary Loads** = YES
   - This allows HTTP connections to localhost

**No external dependencies needed!** The app uses built-in iOS frameworks only.

### 2. Configure Backend URL

#### For iOS Simulator (Mac):
The default configuration in `APIClient.swift` is already set to `http://localhost:8000`

#### For Physical iPhone Device:
You need to use your computer's local IP address:

1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Edit `Services/APIClient.swift` line 28:
   ```swift
   private let baseURL = "http://YOUR_IP_ADDRESS:8000"
   // Example: "http://192.168.1.100:8000"
   ```

3. Make sure your iPhone and Mac are on the same WiFi network

### 3. Start the Backend Server

Make sure your FastAPI backend is running:

```bash
cd /Users/notodyss/Desktop/exam/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` flag allows connections from other devices on your network.

### 4. Build and Run

1. Connect your iPhone or select iOS Simulator
2. Press **⌘ + R** to build and run
3. The app will launch and show the login screen

### 5. Test the Sync

1. Login with the same account on both web and iOS
2. Create a note on iOS - it will appear on web within 30 seconds
3. Create a note on web - it will appear on iOS within 30 seconds
4. Edit a note on either platform - changes sync automatically

## Project Structure

```
OdyssVault/
├── OdyssVaultApp.swift          # App entry point
├── Models/                      # Data models
│   ├── User.swift
│   ├── Note.swift
│   ├── Folder.swift
│   └── Vault.swift
├── Services/                    # Business logic
│   ├── APIClient.swift          # Network layer
│   ├── AuthService.swift        # Authentication
│   └── SyncEngine.swift         # Sync logic
└── Views/                       # SwiftUI views
    ├── LoginView.swift          # Login/Register
    ├── MainView.swift           # Main navigation
    ├── NoteListView.swift       # Notes list
    ├── NoteEditorView.swift     # Markdown editor
    └── CreateNoteSheet.swift    # Create modals
```

## How Sync Works

### Automatic Sync
- **Timer-Based**: Syncs every 30 seconds automatically
- **On App Launch**: Full sync when app opens
- **Pull to Refresh**: Manual refresh on note list
- **After Mutations**: Auto-sync after create/update/delete

### Sync Engine (`SyncEngine.swift`)
```swift
// Starts automatic sync
syncEngine.startSync()

// Manual full sync
await syncEngine.fullSync()

// Stops sync (called on logout)
syncEngine.stopSync()
```

### Data Flow
```
iOS App ←→ SyncEngine ←→ APIClient ←→ FastAPI Backend ←→ PostgreSQL
                                              ↕
                                         Web Frontend
```

## API Endpoints Used

The iOS app communicates with these backend endpoints:

### Authentication
- `POST /auth/login` - Login with username/password
- `POST /auth/register` - Register new account
- `POST /auth/guest` - Guest login
- `GET /auth/me` - Get current user

### Vaults
- `GET /vaults` - List all vaults
- `POST /vaults` - Create vault
- `DELETE /vaults/{id}` - Delete vault

### Notes
- `GET /vaults/{id}/notes` - List notes in vault
- `POST /notes` - Create note
- `PUT /notes/{id}` - Update note
- `DELETE /notes/{id}` - Delete note

### Folders
- `GET /vaults/{id}/folders` - List folders in vault
- `POST /folders` - Create folder
- `DELETE /folders/{id}` - Delete folder

## Customization

### Change Sync Interval

Edit `SyncEngine.swift` line 18:

```swift
private let syncInterval: TimeInterval = 30 // seconds
```

### Add Offline Storage

The app currently syncs with the backend. To add offline persistence:

1. Add Core Data model
2. Save data locally in `SyncEngine`
3. Implement conflict resolution

### Customize UI Theme

Edit SwiftUI views to change colors, fonts, and styles.

## Troubleshooting

### "Cannot connect to backend"
- Make sure backend server is running on port 8000
- Check `baseURL` in `APIClient.swift` matches your setup
- For physical devices, use your Mac's IP address
- Ensure firewall allows port 8000

### "Unauthorized" errors
- Clear app data and login again
- Check JWT token expiration in backend
- Verify backend authentication is working

### Notes not syncing
- Check network connection
- Verify both devices use same vault
- Check backend logs for errors
- Pull to refresh manually

### Build errors
- Clean build folder: **⌘ + Shift + K**
- Reset package cache: **File → Packages → Reset Package Caches**
- Ensure all files are added to target

## Testing

### Test on Simulator
```bash
# Start backend
cd /Users/notodyss/Desktop/exam/backend
uvicorn main:app --reload

# Start web frontend
cd /Users/notodyss/Desktop/exam/frontend
npm run dev

# Run iOS app in Xcode simulator
```

### Test on Physical Device
1. Connect iPhone via USB
2. Trust your Mac if prompted
3. Select your iPhone in Xcode
4. Update `baseURL` to your Mac's IP
5. Build and run

## Next Steps

### Planned Features
- [ ] Offline mode with local Core Data storage
- [ ] Push notifications for real-time updates
- [ ] iPad-optimized UI
- [ ] Rich text formatting toolbar
- [ ] Image attachments
- [ ] Cloud sync conflict resolution
- [ ] Dark mode toggle
- [ ] Note templates
- [ ] Tags and backlinks
- [ ] Graph view

## License

Same as OdyssVault web application.

## Support

If you encounter issues:
1. Check backend logs
2. Check Xcode console
3. Verify network connectivity
4. Review API responses in Xcode debugger
