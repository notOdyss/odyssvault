/**
 * Auth Store - Manages authentication state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, vaultsApi, setAuthToken } from '../services/api';

const TOKEN_KEY = 'odyss_auth_token';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      vaults: [],
      activeVaultId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initialize auth from stored token
      initAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          setAuthToken(token);
          const user = await authApi.getMe(token);
          const vaults = await vaultsApi.getAll(token);

          set({
            user,
            isAuthenticated: true,
            vaults,
            activeVaultId: vaults.find(v => v.is_default)?.id || vaults[0]?.id,
            isLoading: false
          });
        } catch (err) {
          // Token expired or invalid
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            vaults: [],
            activeVaultId: null,
            isLoading: false
          });
          setAuthToken(null);
        }
      },

      // Register new user
      register: async (email, username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ email, username, password });
          const { access_token, user } = response;

          setAuthToken(access_token);

          // Fetch vaults after registration
          const vaults = await vaultsApi.getAll(access_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            vaults,
            activeVaultId: vaults.find(v => v.is_default)?.id || vaults[0]?.id,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (err) {
          const message = err.response?.data?.detail || 'Registration failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          const { access_token, user } = response;

          setAuthToken(access_token);

          // Fetch vaults
          const vaults = await vaultsApi.getAll(access_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            vaults,
            activeVaultId: vaults.find(v => v.is_default)?.id || vaults[0]?.id,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (err) {
          const message = err.response?.data?.detail || 'Login failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Guest login
      loginAsGuest: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.guestLogin();
          const { access_token, user } = response;

          setAuthToken(access_token);

          // Fetch vaults
          const vaults = await vaultsApi.getAll(access_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            vaults,
            activeVaultId: vaults.find(v => v.is_default)?.id || vaults[0]?.id,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (err) {
          const message = err.response?.data?.detail || 'Guest login failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Logout
      logout: async () => {
        const token = get().token;
        try {
          if (token) {
            await authApi.logout(token);
          }
        } catch (err) {
          // Ignore logout errors
        }

        setAuthToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          vaults: [],
          activeVaultId: null,
          error: null
        });
      },

      // Vault management
      setActiveVault: (vaultId) => {
        set({ activeVaultId: vaultId });
      },

      createVault: async (name) => {
        const token = get().token;
        if (!token) return { success: false, error: 'Not authenticated' };

        try {
          const vault = await vaultsApi.create({ name }, token);
          set((state) => ({
            vaults: [...state.vaults, vault]
          }));
          return { success: true, vault };
        } catch (err) {
          const message = err.response?.data?.detail || 'Failed to create vault';
          return { success: false, error: message };
        }
      },

      deleteVault: async (vaultId) => {
        const token = get().token;
        if (!token) return { success: false, error: 'Not authenticated' };

        try {
          await vaultsApi.delete(vaultId, token);
          set((state) => ({
            vaults: state.vaults.filter(v => v.id !== vaultId),
            activeVaultId: state.activeVaultId === vaultId
              ? state.vaults.find(v => v.id !== vaultId)?.id
              : state.activeVaultId
          }));
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.detail || 'Failed to delete vault';
          return { success: false, error: message };
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'odyss-auth',
      partialize: (state) => ({
        token: state.token,
        activeVaultId: state.activeVaultId
      }),
    }
  )
);
