/**
 * CreateNoteModal - Obsidian-style note creation
 * Shows name input with .od extension preview
 */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/CreateNoteModal.module.css';

export function CreateNoteModal({ isOpen, onClose, onCreate, folders, currentFolderId }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState(currentFolderId);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setFolderId(currentFolderId);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentFolderId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), folderId);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('createNote.placeholder')}
              className={styles.input}
              autoComplete="off"
            />
          </div>

          <div className={styles.preview}>
            <span className={styles.filename}>
              {name || t('workspace.untitled').toLowerCase()}<span className={styles.extension}>.od</span>
            </span>
          </div>

          {folders.length > 0 && (
            <div className={styles.folderSelect}>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                className={styles.select}
              >
                <option value="">{t('createNote.noFolder')}</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              {t('createNote.cancel')}
            </button>
            <button type="submit" disabled={!name.trim()} className={styles.createBtn}>
              {t('createNote.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
