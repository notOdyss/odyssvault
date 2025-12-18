/**
 * API Service Layer
 * Handles all HTTP requests to the backend.
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

/**
 * Notes API
 */
export const notesApi = {
  getAll: async (folderId = null, vaultId = null) => {
    const params = {};
    if (folderId) params.folder_id = folderId;
    if (vaultId) params.vault_id = vaultId;
    const response = await apiClient.get('/notes', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/notes/${id}`);
    return response.data;
  },

  create: async (noteData) => {
    const response = await apiClient.post('/notes', noteData);
    return response.data;
  },

  update: async (id, noteData) => {
    const response = await apiClient.put(`/notes/${id}`, noteData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/notes/${id}`);
    return response.data;
  },
};

/**
 * Folders API
 */
export const foldersApi = {
  getAll: async (vaultId = null) => {
    const params = {};
    if (vaultId) params.vault_id = vaultId;
    const response = await apiClient.get('/folders', { params });
    return response.data;
  },

  create: async (folderData) => {
    const response = await apiClient.post('/folders', folderData);
    return response.data;
  },

  update: async (id, folderData) => {
    const response = await apiClient.put(`/folders/${id}`, folderData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/folders/${id}`);
    return response.data;
  },
};

/**
 * Graph API
 */
export const graphApi = {
  getData: async (vaultId = null) => {
    const params = {};
    if (vaultId) params.vault_id = vaultId;
    const response = await apiClient.get('/graph', { params });
    return response.data;
  },
};

/**
 * Auth API
 */
export const authApi = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  guestLogin: async () => {
    const response = await apiClient.post('/auth/guest');
    return response.data;
  },

  getMe: async (token) => {
    const response = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  logout: async (token) => {
    const response = await apiClient.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

/**
 * Vaults API
 */
export const vaultsApi = {
  getAll: async (token) => {
    const response = await apiClient.get('/vaults', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  create: async (vaultData, token) => {
    const response = await apiClient.post('/vaults', vaultData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  delete: async (id, token) => {
    const response = await apiClient.delete(`/vaults/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

/**
 * Version History API
 */
export const versionsApi = {
  getVersions: async (noteId) => {
    const response = await apiClient.get(`/notes/${noteId}/versions`);
    return response.data;
  },

  restoreVersion: async (noteId, versionId) => {
    const response = await apiClient.post(`/notes/${noteId}/versions/${versionId}/restore`);
    return response.data;
  },
};

// Add auth token interceptor
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
