/**
 * VersionHistory - Shows and manages note version history
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { versionsApi } from '../../services/api';
import styles from './VersionHistory.module.css';

export function VersionHistory({ noteId, onRestore, onClose }) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    if (noteId) {
      loadVersions();
    }
  }, [noteId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await versionsApi.getVersions(noteId);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version) => {
    if (!window.confirm(`Restore to version from ${new Date(version.created_at).toLocaleString()}?`)) {
      return;
    }

    try {
      setRestoring(version.id);
      const restoredNote = await versionsApi.restoreVersion(noteId, version.id);
      onRestore(restoredNote);
      await loadVersions(); // Refresh list
    } catch (err) {
      console.error('Failed to restore version:', err);
      alert('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getTruncatedContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3>{t('versions.title')}</h3>
            <span className={styles.count}>{versions.length} {t('versions.versions')}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>{t('common.loading')}</p>
            </div>
          ) : versions.length === 0 ? (
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p>{t('versions.noVersions')}</p>
              <span>{t('versions.hint')}</span>
            </div>
          ) : (
            <div className={styles.list}>
              {versions.map((version, index) => (
                <div key={version.id} className={styles.version}>
                  <div className={styles.versionHeader}>
                    <div className={styles.versionInfo}>
                      <span className={styles.versionTitle}>{version.title}</span>
                      <span className={styles.versionDate}>{formatDate(version.created_at)}</span>
                    </div>
                    <button
                      className={styles.restoreBtn}
                      onClick={() => handleRestore(version)}
                      disabled={restoring === version.id}
                      title={t('versions.restore')}
                    >
                      {restoring === version.id ? (
                        <div className={styles.spinner}></div>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className={styles.versionContent}>
                    {getTruncatedContent(version.content)}
                  </div>
                  <div className={styles.versionMeta}>
                    {new Date(version.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
