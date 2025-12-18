//
//  APIClient.swift
//  OdyssVault
//
//  Network layer for communicating with FastAPI backend
//

import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case serverError(String)
    case decodingError
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Unauthorized. Please login again."
        case .serverError(let message):
            return message
        case .decodingError:
            return "Failed to decode response"
        case .networkError(let error):
            return error.localizedDescription
        }
    }
}

class APIClient {
    static let shared = APIClient()

    // Change this to your backend URL
    // For iOS Simulator: Use 127.0.0.1 (IPv4) instead of localhost to avoid IPv6 issues
    // For physical device: http://YOUR_COMPUTER_IP:8000
    private let baseURL = "http://127.0.0.1:8000"

    private var accessToken: String? {
        get { UserDefaults.standard.string(forKey: "access_token") }
        set { UserDefaults.standard.set(newValue, forKey: "access_token") }
    }

    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        // Try multiple date formats
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)

        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            // Try ISO8601 first
            if let date = ISO8601DateFormatter().date(from: dateString) {
                return date
            }

            // Try custom format (FastAPI datetime format)
            if let date = formatter.date(from: dateString) {
                return date
            }

            // Try without microseconds
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            if let date = formatter.date(from: dateString) {
                return date
            }

            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
        }
        return decoder
    }()

    private let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()

    private init() {}

    // MARK: - Generic Request Method

    private func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil,
        authenticated: Bool = true
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }

        print("🌐 API Request: \(method) \(url)")

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated, let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try encoder.encode(body)
        }

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            switch httpResponse.statusCode {
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
            case 401:
                throw APIError.unauthorized
            case 400...599:
                if let errorMessage = try? decoder.decode([String: String].self, from: data),
                   let detail = errorMessage["detail"] {
                    throw APIError.serverError(detail)
                }
                throw APIError.serverError("Server error: \(httpResponse.statusCode)")
            default:
                throw APIError.invalidResponse
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    // MARK: - Authentication

    func login(username: String, password: String) async throws -> AuthResponse {
        // FastAPI OAuth2 uses form data
        var components = URLComponents(string: baseURL + "/auth/login")!
        components.queryItems = [
            URLQueryItem(name: "username", value: username),
            URLQueryItem(name: "password", value: password)
        ]

        guard let url = components.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let formData = "username=\(username)&password=\(password)"
        request.httpBody = formData.data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw APIError.unauthorized
        }

        let authResponse = try decoder.decode(AuthResponse.self, from: data)
        accessToken = authResponse.accessToken
        return authResponse
    }

    func register(username: String, email: String, password: String) async throws -> AuthResponse {
        let request = RegisterRequest(username: username, email: email, password: password)
        let response: AuthResponse = try await self.request("/auth/register", method: "POST", body: request, authenticated: false)
        accessToken = response.accessToken
        return response
    }

    func guestLogin() async throws -> AuthResponse {
        print("🔑 Attempting guest login...")
        let response: AuthResponse = try await self.request("/auth/guest", method: "POST", authenticated: false)
        accessToken = response.accessToken
        print("✅ Guest login successful! Token saved.")
        return response
    }

    func logout() {
        accessToken = nil
        UserDefaults.standard.removeObject(forKey: "access_token")
    }

    func getCurrentUser() async throws -> User {
        return try await request("/auth/me")
    }

    // MARK: - Vaults

    func getVaults() async throws -> [Vault] {
        return try await request("/vaults")
    }

    func createVault(name: String) async throws -> Vault {
        let request = CreateVaultRequest(name: name)
        return try await self.request("/vaults", method: "POST", body: request)
    }

    func deleteVault(_ id: Int) async throws {
        let _: [String: String] = try await request("/vaults/\(id)", method: "DELETE")
    }

    // MARK: - Notes

    func getNotes(vaultId: Int) async throws -> [Note] {
        return try await request("/notes?vault_id=\(vaultId)")
    }

    func createNote(title: String, content: String, vaultId: Int, folderId: Int? = nil) async throws -> Note {
        let request = CreateNoteRequest(title: title, content: content, vaultId: vaultId, folderId: folderId)
        return try await self.request("/notes", method: "POST", body: request)
    }

    func updateNote(_ id: Int, title: String?, content: String?, folderId: Int? = nil) async throws -> Note {
        let request = UpdateNoteRequest(title: title, content: content, folderId: folderId)
        return try await self.request("/notes/\(id)", method: "PUT", body: request)
    }

    func deleteNote(_ id: Int) async throws {
        let _: [String: String] = try await request("/notes/\(id)", method: "DELETE")
    }

    // MARK: - Folders

    func getFolders(vaultId: Int) async throws -> [Folder] {
        return try await request("/folders?vault_id=\(vaultId)")
    }

    func createFolder(name: String, vaultId: Int) async throws -> Folder {
        let request = CreateFolderRequest(name: name, vaultId: vaultId)
        return try await self.request("/folders", method: "POST", body: request)
    }

    func deleteFolder(_ id: Int) async throws {
        let _: [String: String] = try await request("/folders/\(id)", method: "DELETE")
    }
}
