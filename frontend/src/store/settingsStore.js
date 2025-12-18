/**
 * Settings Store - Manages theme, font, and editor preferences
 * Uses Zustand with localStorage persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_SETTINGS = {
  // Theme
  theme: 'dark',

  // Editor
  fontFamily: 'system',
  fontSize: 14,
  lineHeight: 1.6,
  showLineNumbers: false,
  tabSize: 2,
  wordWrap: true,
  spellCheck: false,

  // Preview
  previewFontFamily: 'system',
  previewFontSize: 14,

  // Sidebar
  defaultSidebarWidth: 260,

  // Editor/Preview split
  defaultSplitPosition: 50,

  // Autosave
  autosaveDelay: 800,

  // Startup
  showHotkeyGuideOnStartup: true,
  reopenLastNote: true,

  // Language
  language: 'en'
};

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      // Actions
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize: Math.max(10, Math.min(24, fontSize)) }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setShowLineNumbers: (show) => set({ showLineNumbers: show }),
      setTabSize: (size) => set({ tabSize: size }),
      setWordWrap: (wrap) => set({ wordWrap: wrap }),
      setSpellCheck: (check) => set({ spellCheck: check }),

      setPreviewFontFamily: (fontFamily) => set({ previewFontFamily: fontFamily }),
      setPreviewFontSize: (fontSize) => set({ previewFontSize: Math.max(10, Math.min(24, fontSize)) }),

      setAutosaveDelay: (delay) => set({ autosaveDelay: delay }),

      setShowHotkeyGuideOnStartup: (show) => set({ showHotkeyGuideOnStartup: show }),
      setReopenLastNote: (reopen) => set({ reopenLastNote: reopen }),

      setLanguage: (language) => set({ language }),

      // Bulk update
      updateSettings: (updates) => set(updates),

      // Reset to defaults
      resetSettings: () => {
        set(DEFAULT_SETTINGS);
        document.documentElement.setAttribute('data-theme', DEFAULT_SETTINGS.theme);
      },

      // Get font-family CSS value
      getFontFamilyCSS: () => {
        const { fontFamily } = get();
        const fontMap = {
          'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          'mono': '"Consolas", "Monaco", "Fira Code", monospace',
          'serif': '"Georgia", "Times New Roman", serif',
          'inter': '"Inter", -apple-system, sans-serif',
          'jetbrains': '"JetBrains Mono", monospace'
        };
        return fontMap[fontFamily] || fontMap.system;
      },

      // Apply theme on init
      initTheme: () => {
        const { theme } = get();
        document.documentElement.setAttribute('data-theme', theme);
      }
    }),
    {
      name: 'odyssvault-settings',
      partialize: (state) => ({
        theme: state.theme,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        showLineNumbers: state.showLineNumbers,
        tabSize: state.tabSize,
        wordWrap: state.wordWrap,
        spellCheck: state.spellCheck,
        previewFontFamily: state.previewFontFamily,
        previewFontSize: state.previewFontSize,
        autosaveDelay: state.autosaveDelay,
        showHotkeyGuideOnStartup: state.showHotkeyGuideOnStartup,
        reopenLastNote: state.reopenLastNote,
        language: state.language
      })
    }
  )
);

export default useSettingsStore;
