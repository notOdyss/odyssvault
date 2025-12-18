//
//  User.swift
//  OdyssVault
//

import Foundation

struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let email: String
    let isGuest: Bool
    let isActive: Bool?  // Optional - might not be in all responses
    let createdAt: Date?  // Optional - might not be in all responses

    enum CodingKeys: String, CodingKey {
        case id, username, email
        case isGuest = "is_guest"
        case isActive = "is_active"
        case createdAt = "created_at"
    }

    // Initialize with defaults for missing fields
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        username = try container.decode(String.self, forKey: .username)
        email = try container.decode(String.self, forKey: .email)
        isGuest = try container.decode(Bool.self, forKey: .isGuest)
        isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
    }
}

struct LoginRequest: Codable {
    let username: String
    let password: String
}

struct RegisterRequest: Codable {
    let username: String
    let email: String
    let password: String
}

struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String?
    let user: User

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case user
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        accessToken = try container.decode(String.self, forKey: .accessToken)
        tokenType = try container.decodeIfPresent(String.self, forKey: .tokenType) ?? "bearer"
        user = try container.decode(User.self, forKey: .user)
    }
}
