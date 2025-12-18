/**
 * Settings panel - theme selection, language, and folder management
 * Located in bottom-left of sidebar
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../i18n';
import styles from '../styles/Settings.module.css';

const THEMES = [
  { id: 'dark', color: '#1e1e1e' },
  { id: 'light', color: '#ffffff' },
  { id: 'nord', color: '#2e3440' },
  { id: 'ocean', color: '#0d1b2a' },
];

export function Settings({
  isOpen,
  onToggle,
  currentTheme,
  onThemeChange,
  folders,
  onCreateFolder,
  onDeleteFolder,
  onOpenPlugins,
  onOpenImport,
}) {
  const { t, i18n } = useTranslation();
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolders, setShowFolders] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  return (
    <div className={styles.container}>
      {/* Settings toggle button */}
      <button className={styles.toggleBtn} onClick={onToggle} title="Settings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span>{t('settings.title')}</span>
            <button onClick={onToggle} className={styles.closeBtn}>×</button>
          </div>

          {/* Theme selection */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{t('settings.theme')}</div>
            <div className={styles.themes}>
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={`${styles.themeBtn} ${currentTheme === theme.id ? styles.active : ''}`}
                  onClick={() => onThemeChange(theme.id)}
                  title={t(`settings.themes.${theme.id}`)}
                >
                  <span
                    className={styles.themeColor}
                    style={{ background: theme.color }}
                  />
                  <span className={styles.themeName}>{t(`settings.themes.${theme.id}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language selection */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => setShowLanguages(!showLanguages)}
            >
              <span className={styles.sectionTitle}>{t('settings.language')}</span>
              <span className={styles.expandIcon}>{showLanguages ? '−' : '+'}</span>
            </button>

            {showLanguages && (
              <div className={styles.languagesContent}>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    className={`${styles.langBtn} ${i18n.language === lang.code ? styles.active : ''}`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <span className={styles.langNative}>{lang.nativeName}</span>
                    <span className={styles.langName}>{lang.name}</span>
                    {i18n.language === lang.code && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Folders management */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => setShowFolders(!showFolders)}
            >
              <span className={styles.sectionTitle}>{t('settings.folders')}</span>
              <span className={styles.expandIcon}>{showFolders ? '−' : '+'}</span>
            </button>

            {showFolders && (
              <div className={styles.foldersContent}>
                <form onSubmit={handleCreateFolder} className={styles.createFolder}>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder={t('settings.folderName')}
                    className={styles.folderInput}
                  />
                  <button type="submit" className={styles.addFolderBtn} disabled={!newFolderName.trim()}>
                    +
                  </button>
                </form>

                <div className={styles.folderList}>
                  {folders.length === 0 ? (
                    <div className={styles.emptyFolders}>{t('settings.noFolder')}</div>
                  ) : (
                    folders.map(folder => (
                      <div key={folder.id} className={styles.folderItem}>
                        <span className={styles.folderIcon}>📁</span>
                        <span className={styles.folderName}>{folder.name}</span>
                        <button
                          className={styles.deleteFolderBtn}
                          onClick={() => onDeleteFolder(folder.id)}
                          title={t('settings.deleteFolder')}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional features */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{t('common.import')}</div>
            <button className={styles.actionBtn} onClick={onOpenImport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{t('import.title')}</span>
            </button>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>{t('settings.plugins')}</div>
            <button className={styles.actionBtn} onClick={onOpenPlugins}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>{t('plugins.title')}</span>
            </button>
          </div>

          {/* App info */}
          <div className={styles.footer}>
            <span className={styles.appName}>OdyssVault</span>
            <span className={styles.version}>v2.0</span>
          </div>
        </div>
      )}
    </div>
  );
}
