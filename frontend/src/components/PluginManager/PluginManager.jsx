/**
 * PluginManager - Manage and install plugins
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PluginManager.module.css';

// Sample plugins for demonstration
const AVAILABLE_PLUGINS = [
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Add a calendar view to visualize daily notes',
    author: 'OdyssVault',
    version: '1.0.0',
    installed: false
  },
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'Create kanban boards from your notes',
    author: 'OdyssVault',
    version: '1.0.0',
    installed: false
  },
  {
    id: 'tags',
    name: 'Tag Manager',
    description: 'Advanced tag management and filtering',
    author: 'OdyssVault',
    version: '1.0.0',
    installed: false
  }
];

export function PluginManager({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [plugins, setPlugins] = useState(AVAILABLE_PLUGINS);
  const [searchQuery, setSearchQuery] = useState('');

  const handleInstall = (pluginId) => {
    setPlugins(plugins.map(p =>
      p.id === pluginId ? { ...p, installed: true } : p
    ));
  };

  const handleUninstall = (pluginId) => {
    setPlugins(plugins.map(p =>
      p.id === pluginId ? { ...p, installed: false } : p
    ));
  };

  const filteredPlugins = plugins.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <h3>{t('plugins.title')}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.search}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={t('plugins.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.content}>
          {filteredPlugins.length === 0 ? (
            <div className={styles.empty}>
              <p>{t('plugins.noPlugins')}</p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredPlugins.map((plugin) => (
                <div key={plugin.id} className={styles.plugin}>
                  <div className={styles.pluginInfo}>
                    <div className={styles.pluginHeader}>
                      <h4>{plugin.name}</h4>
                      {plugin.installed && (
                        <span className={styles.installedBadge}>{t('plugins.installed')}</span>
                      )}
                    </div>
                    <p className={styles.pluginDescription}>{plugin.description}</p>
                    <div className={styles.pluginMeta}>
                      <span>by {plugin.author}</span>
                      <span>•</span>
                      <span>v{plugin.version}</span>
                    </div>
                  </div>
                  <div className={styles.pluginActions}>
                    {plugin.installed ? (
                      <button
                        className={`${styles.actionBtn} ${styles.uninstallBtn}`}
                        onClick={() => handleUninstall(plugin.id)}
                      >
                        {t('plugins.uninstall')}
                      </button>
                    ) : (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleInstall(plugin.id)}
                      >
                        {t('plugins.install')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.note}>{t('plugins.note')}</p>
        </div>
      </div>
    </div>
  );
}
