# OdyssVault iOS - Quick Start Guide

Get your iOS app running in 5 minutes!

## Step 1: Open Xcode

1. Open **Xcode** on your Mac
2. Create new project: **File → New → Project**
3. Choose **iOS → App**
4. Name it **"OdyssVault"**
5. Interface: **SwiftUI**
6. Language: **Swift**
7. Click **Create**

## Step 2: Add Project Files

1. In Finder, go to `/Users/notodyss/Desktop/exam/ios/OdyssVault/`
2. Drag all folders into Xcode project:
   - `Models/`
   - `Services/`
   - `Views/`
   - `OdyssVaultApp.swift`
3. Check **"Copy items if needed"**
4. Check your app target

**Note:** Do NOT add Info.plist - Xcode generates this automatically for modern apps!

## Step 3: Configure App Settings

1. Click on your **OdyssVault** project in Xcode (blue icon at top)
2. Select **OdyssVault** target (under TARGETS)
3. Go to **Info** tab
4. Under **Custom iOS Target Properties**, add a new row:
   - Click **+** button
   - Type: **App Transport Security Settings**
   - Expand it, click **+** inside
   - Type: **Allow Arbitrary Loads**
   - Set value to **YES**

This allows HTTP connections to your localhost backend.

## Step 4: Configure for Device Testing

### For Simulator (Easy):
- No configuration needed!
- The app is already set to `http://localhost:8000`

### For Physical iPhone:
1. Find your Mac's IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Example output: `inet 192.168.1.100`

2. Open `Services/APIClient.swift` in Xcode
3. Change line 28:
   ```swift
   private let baseURL = "http://192.168.1.100:8000"
   ```
   (Replace with YOUR IP)

4. Make sure iPhone and Mac are on same WiFi

## Step 5: Start Backend Server

```bash
cd /Users/notodyss/Desktop/exam/backend
uvicorn main:app --reload --host 0.0.0.0
```

The `--host 0.0.0.0` is important for device testing!

## Step 6: Run the App

1. Select your device/simulator in Xcode toolbar
2. Press **⌘ + R** or click ▶️ button
3. Wait for build to complete
4. App launches automatically!

**Tip:** Open the debug console in Xcode (⌘ + Shift + Y) to see helpful logs and error messages.

## Step 7: Test the Sync

### Create Account
1. Tap **"Don't have an account? Register"**
2. Enter username, email, password
3. Tap **Register**

### Or Use Guest Mode
1. Tap **"Continue as Guest"**

### Create a Note
1. Tap **⋯** menu (top right)
2. Tap **"New Note"**
3. Enter a title
4. Tap **Create**
5. Start writing!

### Test Sync with Web
1. Open web app: `http://localhost:5174`
2. Login with same account
3. Create note on web → appears on iOS in ~30 seconds
4. Create note on iOS → appears on web in ~30 seconds
5. Edit on either → syncs automatically!

## Common Issues

### "Multiple commands produce Info.plist"
**Problem:** You accidentally added the Info.plist file to your project.
**Fix:**
1. In Xcode, find `Info.plist` in the file navigator
2. Right-click → Delete → Move to Trash
3. Clean Build: ⌘ + Shift + K
4. Build again: ⌘ + R

Modern iOS apps don't need a separate Info.plist file!

### "Haptic feedback" warnings in console
**Problem:** Lots of `CHHapticPattern.mm` errors about missing haptic files.
**Is it bad?** ❌ NO! This is completely harmless.

**Why it happens:**
- iOS Simulator doesn't have haptic hardware
- System tries to load haptic feedback files that don't exist on simulator
- These are just warnings from iOS, not from your app

**Fix:** Ignore them! Your app works perfectly. They only appear in simulator.

On a real iPhone, you won't see these warnings.

### "404 Not Found" for /vaults/6/notes
**Problem:** Wrong API endpoints.
**Status:** ✅ FIXED!

The app was using `/vaults/{id}/notes` but the backend uses `/notes?vault_id={id}`.

Already fixed in the latest version!

### "Data couldn't be read because it isn't in the correct format"
**Problem:** JSON decoding error from backend response.
**Fix:**
1. Open Xcode console (⌘ + Shift + Y)
2. Look for `❌ Decoding error` messages showing the raw response
3. Common causes:
   - Backend not running: Start with `uvicorn main:app --reload --host 0.0.0.0`
   - Wrong backend URL: Check `APIClient.swift` baseURL matches your setup
   - Date format mismatch: Already handled with custom date decoder
4. Try again after fixing the issue

The app now has flexible date parsing and will show you exactly what went wrong in the console!

### "Cannot connect to server"
**Simulator:**
```bash
# Make sure backend is running
cd /Users/notodyss/Desktop/exam/backend
uvicorn main:app --reload
```

**Physical Device:**
- Use Mac's IP, not localhost
- Both devices on same WiFi
- Backend started with `--host 0.0.0.0`
- Check firewall settings

### Build Errors
```bash
# In Xcode:
# 1. Clean Build Folder: ⌘ + Shift + K
# 2. File → Packages → Reset Package Caches
# 3. Build again: ⌘ + R
```

### Sync Not Working
- Pull down on notes list to refresh
- Check backend is running
- Look at Xcode console for errors
- Verify you're logged into same account on both

## File Structure You Just Added

```
OdyssVault/
├── OdyssVaultApp.swift          ← Main app entry
├── Info.plist                   ← App configuration
├── Models/
│   ├── User.swift               ← User data model
│   ├── Note.swift               ← Note data model
│   ├── Folder.swift             ← Folder data model
│   └── Vault.swift              ← Vault data model
├── Services/
│   ├── APIClient.swift          ← Talks to backend
│   ├── AuthService.swift        ← Login/logout logic
│   └── SyncEngine.swift         ← Syncs data automatically
└── Views/
    ├── LoginView.swift          ← Login screen
    ├── MainView.swift           ← Main app navigation
    ├── NoteListView.swift       ← Shows all notes
    ├── NoteEditorView.swift     ← Edit notes (markdown)
    └── CreateNoteSheet.swift    ← Create note/folder
```

## Next: Customize!

Now that it's running, you can:
- Change colors in the SwiftUI views
- Adjust sync interval in `SyncEngine.swift`
- Add more features
- Customize markdown rendering
- Add your own icons

## Pro Tips

### Enable Live Preview in Xcode
- Open any `.swift` file with SwiftUI
- Press **⌘ + Option + Enter**
- Click **Resume** button
- See changes instantly!

### Debugging
- Add breakpoints by clicking line numbers
- View network requests in console
- Check `print()` statements for sync status

### Reload Without Rebuilding
- Make UI changes
- Live Preview updates automatically
- No need to rebuild full app!

That's it! You now have a fully synced iOS app working with your OdyssVault web application. 🎉
