//
//  Folder.swift
//  OdyssVault
//

import Foundation

struct Folder: Codable, Identifiable, Equatable {
    let id: Int
    var name: String
    let vaultId: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name
        case vaultId = "vault_id"
        case createdAt = "created_at"
    }
}

struct CreateFolderRequest: Codable {
    let name: String
    let vaultId: Int

    enum CodingKeys: String, CodingKey {
        case name
        case vaultId = "vault_id"
    }
}
