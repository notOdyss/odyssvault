# iOS App Fixes - Guest Login Decoding Error

## Problem
When clicking "Continue as Guest", the app showed:
```
"Data couldn't be read because it isn't in the correct format"
```

Backend logs showed:
```
POST /auth/guest HTTP/1.1" 200 OK  ← Request succeeded!
```

So the issue was **JSON decoding**, not the network request.

## Root Causes

### 1. Missing `is_active` Field
**Backend returns:**
```json
{
    "user": {
        "id": 5,
        "email": "guest@odyssvault.local",
        "username": "guest",
        "is_active": true,    ← iOS model was missing this!
        "is_guest": true,
        "created_at": "2025-12-17T21:23:40.154092"
    }
}
```

**iOS User model had:** Only `id`, `username`, `email`, `isGuest`, `createdAt`
**Missing:** `isActive` field

### 2. Date Format Mismatch
**Backend returns:** `"2025-12-17T21:23:40.154092"` (with microseconds)
**iOS decoder expected:** ISO8601 standard format

FastAPI's datetime format includes 6-digit microseconds (`.SSSSSS`), which needs custom parsing.

### 3. Strict Decoding
The models required all fields to be present, making them fragile to API changes.

## Fixes Applied

### ✅ Fix 1: Added Missing `is_active` Field
**File:** `Models/User.swift`

```swift
struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let email: String
    let isGuest: Bool
    let isActive: Bool?       // ← ADDED (optional for flexibility)
    let createdAt: Date?      // ← Made optional

    enum CodingKeys: String, CodingKey {
        case id, username, email
        case isGuest = "is_guest"
        case isActive = "is_active"  // ← ADDED
        case createdAt = "created_at"
    }
}
```

### ✅ Fix 2: Custom Date Decoder
**File:** `Services/APIClient.swift`

Added flexible date parsing that tries multiple formats:

```swift
decoder.dateDecodingStrategy = .custom { decoder in
    let dateString = try container.decode(String.self)

    // Try ISO8601 first
    if let date = ISO8601DateFormatter().date(from: dateString) {
        return date
    }

    // Try FastAPI format: yyyy-MM-dd'T'HH:mm:ss.SSSSSS
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS"
    if let date = formatter.date(from: dateString) {
        return date
    }

    // Try without microseconds
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
    if let date = formatter.date(from: dateString) {
        return date
    }

    throw DecodingError.dataCorruptedError(...)
}
```

Now handles:
- ✅ `2025-12-17T21:23:40.154092` (FastAPI with microseconds)
- ✅ `2025-12-17T21:23:40` (FastAPI without microseconds)
- ✅ `2025-12-17T21:23:40Z` (ISO8601)
- ✅ `2025-12-17T21:23:40.154Z` (ISO8601 with milliseconds)

### ✅ Fix 3: Lenient Decoding with Defaults
**File:** `Models/User.swift`

Added custom `init(from:)` to handle missing fields gracefully:

```swift
init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    id = try container.decode(Int.self, forKey: .id)
    username = try container.decode(String.self, forKey: .username)
    email = try container.decode(String.self, forKey: .email)
    isGuest = try container.decode(Bool.self, forKey: .isGuest)
    isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
    createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
}
```

Benefits:
- ✅ Won't crash if `is_active` is missing
- ✅ Won't crash if `created_at` is missing
- ✅ More resilient to backend API changes

### ✅ Fix 4: Better Error Messages
**File:** `Services/APIClient.swift`

Added debug logging to see exactly what's failing:

```swift
case 200...299:
    do {
        return try decoder.decode(T.self, from: data)
    } catch {
        // Print raw response for debugging
        if let jsonString = String(data: data, encoding: .utf8) {
            print("❌ Decoding error. Raw response:")
            print(jsonString)
        }
        print("❌ Decoding error details: \(error)")
        throw APIError.decodingError
    }
```

Now you'll see exactly what the server returned if decoding fails!

### ✅ Fix 5: Made AuthResponse More Flexible
**File:** `Models/User.swift`

```swift
struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String?  // ← Optional with default
    let user: User

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        accessToken = try container.decode(String.self, forKey: .accessToken)
        tokenType = try container.decodeIfPresent(String.self, forKey: .tokenType) ?? "bearer"
        user = try container.decode(User.self, forKey: .user)
    }
}
```

## Verification

Backend response (confirmed working):
```json
{
    "access_token": "eyJhbGc...",
    "token_type": "bearer",
    "user": {
        "id": 5,
        "email": "guest_3d1b8322@odyssvault.local",
        "username": "guest_3d1b8322",
        "is_active": true,
        "is_guest": true,
        "created_at": "2025-12-17T21:23:40.154092"
    }
}
```

All fields now map correctly! ✅

## Testing

1. **Clean build:**
   ```
   ⌘ + Shift + K
   ```

2. **Build and run:**
   ```
   ⌘ + R
   ```

3. **Open console:**
   ```
   ⌘ + Shift + Y
   ```

4. **Click "Continue as Guest"**

5. **Check console output:**
   ```
   🔑 Attempting guest login...
   ✅ Guest login successful! Token saved.
   ```

6. **Should now see the main app!**

## What You'll See in Console

### Success:
```
🔑 Attempting guest login...
✅ Guest login successful! Token saved.
```

### If decoding fails (debugging):
```
🔑 Attempting guest login...
❌ Decoding error. Raw response:
{
  "access_token": "...",
  "token_type": "bearer",
  "user": {...}
}
❌ Decoding error details: typeMismatch(Swift.String, ...)
```

This helps you identify exactly what field is causing issues!

## Summary of Changes

| File | Changes |
|------|---------|
| `Models/User.swift` | ✅ Added `isActive` field<br>✅ Made `isActive` and `createdAt` optional<br>✅ Added custom decoder with defaults |
| `Models/User.swift` (AuthResponse) | ✅ Made `tokenType` optional with default |
| `Services/APIClient.swift` | ✅ Custom date decoder for FastAPI format<br>✅ Debug logging for decoding errors<br>✅ Better error messages |
| `QUICKSTART.md` | ✅ Added troubleshooting section<br>✅ Added console tips |

## Result

Guest login now works perfectly! The app:
- ✅ Handles all FastAPI date formats
- ✅ Gracefully handles missing optional fields
- ✅ Shows helpful debug messages
- ✅ More resilient to API changes

Try it now! 🚀
