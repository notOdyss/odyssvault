//
//  Colors.swift
//  OdyssVault
//
//  Obsidian-inspired color theme
//

import SwiftUI

extension Color {
    // Obsidian-inspired dark purple theme
    static let obsidianBackground = Color(hex: "1e1e2e")
    static let obsidianSurface = Color(hex: "262637")
    static let obsidianSurfaceHover = Color(hex: "2d2d40")
    static let obsidianBorder = Color(hex: "3b3b4d")

    static let obsidianPurple = Color(hex: "a855f7")
    static let obsidianPurpleLight = Color(hex: "c084fc")
    static let obsidianPurpleDark = Color(hex: "7c3aed")

    static let obsidianText = Color(hex: "dcddde")
    static let obsidianTextMuted = Color(hex: "9ca3af")
    static let obsidianTextFaint = Color(hex: "6b7280")

    // Helper to create color from hex
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
