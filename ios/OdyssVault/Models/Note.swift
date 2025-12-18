//
//  Note.swift
//  OdyssVault
//

import Foundation

struct Note: Codable, Identifiable, Equatable {
    let id: Int
    var title: String
    var content: String
    let vaultId: Int
    var folderId: Int?
    let createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, content
        case vaultId = "vault_id"
        case folderId = "folder_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct CreateNoteRequest: Codable {
    let title: String
    let content: String
    let vaultId: Int
    let folderId: Int?

    enum CodingKeys: String, CodingKey {
        case title, content
        case vaultId = "vault_id"
        case folderId = "folder_id"
    }
}

struct UpdateNoteRequest: Codable {
    let title: String?
    let content: String?
    let folderId: Int?

    enum CodingKeys: String, CodingKey {
        case title, content
        case folderId = "folder_id"
    }
}
