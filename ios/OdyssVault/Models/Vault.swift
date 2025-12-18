//
//  Vault.swift
//  OdyssVault
//

import Foundation

struct Vault: Codable, Identifiable, Equatable {
    let id: Int
    var name: String
    let ownerId: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name
        case ownerId = "owner_id"
        case createdAt = "created_at"
    }
}

struct CreateVaultRequest: Codable {
    let name: String
}
