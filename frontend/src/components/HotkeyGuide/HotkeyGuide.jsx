/**
 * HotkeyGuide - Modal showing keyboard shortcuts
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore, useSettingsStore } from '../../store';
import styles from './HotkeyGuide.module.css';

export function HotkeyGuide() {
  const { t } = useTranslation();
  const { showHotkeyGuide, closeHotkeyGuide } = useUIStore();
  const { showHotkeyGuideOnStartup, setShowHotkeyGuideOnStartup } = useSettingsStore();

  // Build shortcuts with translations
  const SHORTCUTS = useMemo(() => [
    {
      category: t('hotkeyGuide.navigation'),
      shortcuts: [
        { keys: ['Ctrl', 'P'], description: t('hotkeyGuide.shortcuts.commandPalette') },
        { keys: ['Ctrl', 'O'], description: t('hotkeyGuide.shortcuts.quickSwitcher') },
        { keys: ['Ctrl', 'N'], description: t('hotkeyGuide.shortcuts.newNote') },
        { keys: ['Ctrl', 'B'], description: t('hotkeyGuide.shortcuts.toggleSidebar') },
        { keys: ['Ctrl', 'W'], description: t('hotkeyGuide.shortcuts.closeTab') },
      ]
    },
    {
      category: t('hotkeyGuide.editor'),
      shortcuts: [
        { keys: ['Ctrl', 'E'], description: t('hotkeyGuide.shortcuts.toggleViewMode') },
        { keys: ['Ctrl', 'S'], description: t('hotkeyGuide.shortcuts.saveNote') },
        { keys: ['Ctrl', '/'], description: t('hotkeyGuide.shortcuts.showShortcuts') },
      ]
    },
    {
      category: t('hotkeyGuide.formatting'),
      shortcuts: [
        { keys: ['Ctrl', 'B'], description: t('hotkeyGuide.shortcuts.bold') },
        { keys: ['Ctrl', 'I'], description: t('hotkeyGuide.shortcuts.italic') },
        { keys: ['Ctrl', 'K'], description: t('hotkeyGuide.shortcuts.insertLink') },
      ]
    },
    {
      category: t('hotkeyGuide.commandPalette'),
      shortcuts: [
        { keys: ['↑', '↓'], description: t('hotkeyGuide.shortcuts.navigateResults') },
        { keys: ['Enter'], description: t('hotkeyGuide.shortcuts.openSelected') },
        { keys: ['Shift', 'Enter'], description: t('hotkeyGuide.shortcuts.createNew') },
        { keys: ['Ctrl', 'Enter'], description: t('hotkeyGuide.shortcuts.openNewTab') },
        { keys: ['Esc'], description: t('hotkeyGuide.shortcuts.close') },
      ]
    }
  ], [t]);

  if (!showHotkeyGuide) return null;

  return (
    <div className={styles.overlay} onClick={closeHotkeyGuide}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01" />
              <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
              <path d="M6 16h12" />
            </svg>
            {t('hotkeyGuide.title')}
          </h2>
          <button className={styles.closeBtn} onClick={closeHotkeyGuide}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {SHORTCUTS.map(section => (
            <div key={section.category} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.category}</h3>
              <div className={styles.shortcuts}>
                {section.shortcuts.map((shortcut, i) => (
                  <div key={i} className={styles.shortcut}>
                    <span className={styles.keys}>
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className={styles.key}>{key}</kbd>
                          {j < shortcut.keys.length - 1 && <span className={styles.plus}>+</span>}
                        </span>
                      ))}
                    </span>
                    <span className={styles.description}>{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={showHotkeyGuideOnStartup}
              onChange={(e) => setShowHotkeyGuideOnStartup(e.target.checked)}
            />
            <span>{t('hotkeyGuide.showOnStartup')}</span>
          </label>
          <button className={styles.doneBtn} onClick={closeHotkeyGuide}>
            {t('hotkeyGuide.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HotkeyGuide;
