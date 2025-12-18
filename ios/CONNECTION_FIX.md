# Connection Refused Fix - IPv6 vs IPv4 Issue

## Problem

Getting this error even though backend is running:
```
nw_socket_handle_socket_event [C1.1.1:2] Socket SO_ERROR [61: Connection refused]
nw_endpoint_flow_failed_with_error [C1.1.1 ::1.8000 in_progress socket-flow
```

Notice: `::1.8000` ← This is **IPv6** localhost!

## Root Cause

**iOS Simulator was trying to connect via IPv6, but backend only listens on IPv4!**

- `localhost` can resolve to either:
  - `127.0.0.1` (IPv4) ← Backend listens here ✅
  - `::1` (IPv6) ← iOS tried this ❌

- iOS Simulator sometimes prefers IPv6
- Backend was only listening on IPv4
- Result: Connection refused!

## Fixes Applied

### ✅ 1. Force IPv4 Connection

**File:** `Services/APIClient.swift`

**Changed:**
```swift
// Before (WRONG - could use IPv6):
private let baseURL = "http://localhost:8000"

// After (CORRECT - forces IPv4):
private let baseURL = "http://127.0.0.1:8000"
```

Now the app ALWAYS uses IPv4, matching what the backend uses.

### ✅ 2. Better Error Handling

**File:** `Services/SyncEngine.swift`

**Changed:**
```swift
func fullSync() async {
    // ...
    do {
        vaults = try await apiClient.getVaults()
        // ...
        error = nil  // Clear errors on success
    } catch {
        print("⚠️ Sync failed: \(error)")
        self.error = error.localizedDescription

        // Don't crash - app can work offline
        // User will see error message instead
    }
}
```

**Before:** App would crash or freeze
**After:** Shows friendly error message with retry button

### ✅ 3. Error UI in Main View

**File:** `Views/MainView.swift`

**Added:** Connection error screen with:
- ⚠️ Warning icon
- Clear error message
- "Retry Connection" button
- Instructions to start backend

**Before:** Blank screen or crash
**After:** Helpful error message and retry option

### ✅ 4. Debug Logging

**File:** `Services/APIClient.swift`

**Added:**
```swift
print("🌐 API Request: \(method) \(url)")
```

Now you can see EXACTLY what URLs the app is trying to connect to!

## Verification

Backend IS running and accessible:
```bash
$ lsof -i :8000
Python  88044  notodyss  3u  IPv4  ... TCP *:8000 (LISTEN)  ← Running!

$ curl http://127.0.0.1:8000/
{"detail":"Not Found"}  ← Reachable! (404 is expected for root)
```

## Testing

### Step 1: Clean Build
```bash
# In Xcode:
⌘ + Shift + K  # Clean
```

### Step 2: Stop Xcode (if in LLDB)
```bash
# In LLDB console, type:
quit

# Or click Stop button ⏹️
```

### Step 3: Build & Run
```bash
⌘ + R
```

### Step 4: Watch Console
You should now see:
```
🌐 API Request: GET http://127.0.0.1:8000/auth/me
🌐 API Request: POST http://127.0.0.1:8000/auth/guest
🔑 Attempting guest login...
✅ Guest login successful! Token saved.
🌐 API Request: GET http://127.0.0.1:8000/vaults
🌐 API Request: GET http://127.0.0.1:8000/notes?vault_id=6
🌐 API Request: GET http://127.0.0.1:8000/folders?vault_id=6
```

**Backend logs should show:**
```
INFO: 127.0.0.1:xxxxx - "POST /auth/guest HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "GET /vaults HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "GET /notes?vault_id=6 HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "GET /folders?vault_id=6 HTTP/1.1" 200 OK
```

### Step 5: If Still Getting Errors

If you still see connection refused:

1. **Check iOS Simulator network:**
   - In Simulator: Settings → Developer → Network Link Conditioner
   - Make sure it's OFF

2. **Restart Simulator:**
   ```
   Device → Erase All Content and Settings
   Then rebuild: ⌘ + R
   ```

3. **Check firewall:**
   ```bash
   # Mac firewall might be blocking
   System Settings → Network → Firewall
   Make sure Python is allowed
   ```

## What Changed

| Issue | Before | After |
|-------|--------|-------|
| Connection | `localhost` → IPv6 `::1` | `127.0.0.1` → IPv4 ✅ |
| Error handling | Crash or freeze | Friendly error UI ✅ |
| Error visibility | Silent failure | Clear console logs ✅ |
| Recovery | Manual restart | Retry button ✅ |

## Summary

**The app now:**
- ✅ Uses IPv4 (`127.0.0.1`) to match backend
- ✅ Shows friendly error when backend is down
- ✅ Has retry button to reconnect
- ✅ Logs all API requests for debugging
- ✅ Won't crash if connection fails

**Try it now!** Clean build (⌘ + Shift + K) then run (⌘ + R)
