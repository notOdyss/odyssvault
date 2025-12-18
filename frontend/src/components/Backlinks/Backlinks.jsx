/**
 * Backlinks - Shows notes that link to the current note
 */
import { useTranslation } from 'react-i18next';
import styles from './Backlinks.module.css';

export function Backlinks({ note, onNoteClick }) {
  const { t } = useTranslation();

  if (!note) return null;

  const backlinks = note.linked_from || [];

  return (
    <div className={styles.backlinks}>
      <div className={styles.header}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span>{t('backlinks.title')}</span>
        <span className={styles.count}>{backlinks.length}</span>
      </div>

      <div className={styles.list}>
        {backlinks.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('backlinks.noBacklinks')}</p>
            <span className={styles.hint}>{t('backlinks.hint')}</span>
          </div>
        ) : (
          backlinks.map(linkedNote => (
            <button
              key={linkedNote.id}
              className={styles.item}
              onClick={() => onNoteClick(linkedNote.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              <span className={styles.itemTitle}>{linkedNote.title}</span>
              <span className={styles.itemExt}>.od</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
