/**
 * UI Store - Manages modals, panels, and view states
 * Uses Zustand for state management
 */
import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // Sidebar state
  sidebarCollapsed: false,
  sidebarActiveTab: 'files', // 'files' | 'search' | 'bookmarks'

  // Modal states
  showCreateModal: false,
  showSettingsModal: false,
  showCommandPalette: false,
  showHotkeyGuide: false,
  showAuthModal: false,
  showPluginManager: false,
  showFileImport: false,

  // Editor view state
  viewMode: 'split', // 'editor' | 'preview' | 'split'
  showHelp: false,

  // Context menu
  contextMenu: null, // { type: 'note' | 'folder', x, y, data }

  // Search
  searchQuery: '',
  globalSearchOpen: false,

  // Notifications
  notifications: [],

  // Actions - Sidebar
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarActiveTab: (tab) => set({ sidebarActiveTab: tab }),

  // Actions - Modals
  openCreateModal: () => set({ showCreateModal: true }),
  closeCreateModal: () => set({ showCreateModal: false }),

  openSettingsModal: () => set({ showSettingsModal: true }),
  closeSettingsModal: () => set({ showSettingsModal: false }),

  openCommandPalette: () => set({ showCommandPalette: true }),
  closeCommandPalette: () => set({ showCommandPalette: false }),
  toggleCommandPalette: () => set(state => ({ showCommandPalette: !state.showCommandPalette })),

  openHotkeyGuide: () => set({ showHotkeyGuide: true }),
  closeHotkeyGuide: () => set({ showHotkeyGuide: false }),
  toggleHotkeyGuide: () => set(state => ({ showHotkeyGuide: !state.showHotkeyGuide })),

  openAuthModal: () => set({ showAuthModal: true }),
  closeAuthModal: () => set({ showAuthModal: false }),

  openPluginManager: () => set({ showPluginManager: true }),
  closePluginManager: () => set({ showPluginManager: false }),

  openFileImport: () => set({ showFileImport: true }),
  closeFileImport: () => set({ showFileImport: false }),

  // Actions - View Mode
  setViewMode: (mode) => set({ viewMode: mode }),
  cycleViewMode: () => set(state => {
    const modes = ['split', 'editor', 'preview'];
    const currentIndex = modes.indexOf(state.viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    return { viewMode: modes[nextIndex] };
  }),

  toggleHelp: () => set(state => ({ showHelp: !state.showHelp })),

  // Actions - Context Menu
  openContextMenu: (type, x, y, data) => set({
    contextMenu: { type, x, y, data }
  }),
  closeContextMenu: () => set({ contextMenu: null }),

  // Actions - Search
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: '' }),
  toggleGlobalSearch: () => set(state => ({ globalSearchOpen: !state.globalSearchOpen })),

  // Actions - Notifications
  addNotification: (notification) => {
    const id = Date.now();
    set(state => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));
    // Auto-remove after duration
    setTimeout(() => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    }, notification.duration || 3000);
    return id;
  },
  removeNotification: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  // Convenience notification methods
  notify: {
    success: (message) => get().addNotification({ type: 'success', message }),
    error: (message) => get().addNotification({ type: 'error', message }),
    warning: (message) => get().addNotification({ type: 'warning', message }),
    info: (message) => get().addNotification({ type: 'info', message })
  }
}));

export default useUIStore;
