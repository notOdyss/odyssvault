/**
 * FileImport - Import files and convert to notes
 */
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './FileImport.module.css';

const SUPPORTED_FORMATS = [
  { ext: '.md', name: 'Markdown', icon: '📝' },
  { ext: '.txt', name: 'Text', icon: '📄' },
  { ext: '.pdf', name: 'PDF', icon: '📕' },
  { ext: '.doc', name: 'Word (DOC)', icon: '📘' },
  { ext: '.docx', name: 'Word (DOCX)', icon: '📘' }
];

export function FileImport({ isOpen, onClose, onImport }) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return SUPPORTED_FORMATS.some(format => format.ext === ext);
    });
    setSelectedFiles(validFiles);
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;

    setImporting(true);
    try {
      for (const file of selectedFiles) {
        const text = await readFileAsText(file);
        const fileName = file.name.replace(/\.[^/.]+$/, '');

        // Call parent import handler
        await onImport({
          title: fileName,
          content: text,
          originalFormat: file.type || file.name.split('.').pop()
        });
      }

      // Close modal on success
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
      alert(t('import.error'));
    } finally {
      setImporting(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <h3>{t('import.title')}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className={styles.dropText}>{t('import.dropFiles')}</p>
            <span className={styles.dropHint}>{t('import.clickToSelect')}</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className={styles.fileList}>
              <h4>{t('import.selectedFiles')} ({selectedFiles.length})</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFile(index)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.formats}>
            <h4>{t('import.supportedFormats')}</h4>
            <div className={styles.formatGrid}>
              {SUPPORTED_FORMATS.map((format) => (
                <div key={format.ext} className={styles.formatItem}>
                  <span className={styles.formatIcon}>{format.icon}</span>
                  <span className={styles.formatName}>{format.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className={styles.importBtn}
            onClick={handleImport}
            disabled={selectedFiles.length === 0 || importing}
          >
            {importing ? t('import.importing') : t('import.import')}
          </button>
        </div>
      </div>
    </div>
  );
}
