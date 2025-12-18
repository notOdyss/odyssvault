//
//  LoginView.swift
//  OdyssVault
//
//  Login and registration screen
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @State private var isLogin = true
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()
                .onAppear {
                    print("🎨 LoginView background appeared")
                }

            VStack(spacing: 32) {
                Spacer()

                // Logo and title
                VStack(spacing: 16) {
                    // Purple icon
                    Image(systemName: "note.text")
                        .font(.system(size: 50, weight: .light))
                        .foregroundColor(.purple)

                    Text("OdyssVault")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text(isLogin ? "Welcome back" : "Create your account")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.bottom, 20)

                // Form
                VStack(spacing: 14) {
                    if !isLogin {
                        TextField("Email", text: $email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .padding()
                            .background(Color.gray.opacity(0.2))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }

                    TextField("Username", text: $username)
                        .textInputAutocapitalization(.never)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.white)
                        .cornerRadius(10)

                    SecureField("Password", text: $password)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.horizontal, 32)

                // Error message
                if let error = authService.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red.opacity(0.9))
                        .padding(.horizontal, 32)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                        .padding(.horizontal, 32)
                }

                // Submit button
                Button(action: handleSubmit) {
                    HStack(spacing: 10) {
                        if authService.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: isLogin ? "lock.open.fill" : "person.badge.plus.fill")
                            Text(isLogin ? "Sign In" : "Create Account")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.purple)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .padding(.horizontal, 32)
                .disabled(authService.isLoading || !isFormValid)

                // Guest login
                Button(action: handleGuestLogin) {
                    HStack(spacing: 8) {
                        Image(systemName: "person.crop.circle.badge.questionmark")
                        Text("Continue as Guest")
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.gray.opacity(0.3))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray, lineWidth: 1)
                    )
                }
                .padding(.horizontal, 32)
                .padding(.top, 4)
                .disabled(authService.isLoading)

                // Toggle mode
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isLogin.toggle()
                    }
                }) {
                    HStack(spacing: 4) {
                        Text(isLogin ? "Don't have an account?" : "Already have an account?")
                            .foregroundColor(.obsidianTextMuted)
                        Text(isLogin ? "Register" : "Sign In")
                            .foregroundColor(.obsidianPurpleLight)
                            .fontWeight(.semibold)
                    }
                    .font(.subheadline)
                }
                .padding(.top, 20)

                Spacer()
                Spacer()
            }
            .padding(.top, 40)
        }
        .preferredColorScheme(.dark)
    }

    private var isFormValid: Bool {
        if isLogin {
            return !username.isEmpty && !password.isEmpty
        } else {
            return !username.isEmpty && !email.isEmpty && !password.isEmpty
        }
    }

    private func handleSubmit() {
        Task {
            if isLogin {
                await authService.login(username: username, password: password)
            } else {
                await authService.register(username: username, email: email, password: password)
            }
        }
    }

    private func handleGuestLogin() {
        Task {
            await authService.guestLogin()
        }
    }
}

// Custom Obsidian-styled text field
struct ObsidianTextField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false

    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .padding()
        .background(Color.obsidianSurface)
        .foregroundColor(.obsidianText)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.obsidianBorder, lineWidth: 1)
        )
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthService.shared)
}
