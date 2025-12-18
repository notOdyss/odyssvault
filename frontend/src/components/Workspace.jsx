import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { exportToPdf } from '../utils/pdfExport';
import { Backlinks } from './Backlinks';
import { VersionHistory } from './VersionHistory';
import styles from '../styles/Workspace.module.css';

function LinkRenderer({ content, notes, onLinkClick }) {
  const parts = useMemo(() => {
    const result = [];
    const regex = /\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      const linkTitle = match[1];
      const linkedNote = notes.find(n => n.title === linkTitle);
      result.push({
        type: 'link',
        title: linkTitle,
        exists: !!linkedNote,
        noteId: linkedNote?.id
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return result;
  }, [content, notes]);

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <ReactMarkdown
              key={i}
              remarkPlugins={[remarkGfm, remarkBreaks]}
            >
              {part.content}
            </ReactMarkdown>
          );
        }
        return (
          <button
            key={i}
            className={`${styles.noteLink} ${part.exists ? styles.linkExists : styles.linkMissing}`}
            onClick={() => part.exists && onLinkClick(part.noteId)}
            title={part.exists ? `Open "${part.title}"` : `"${part.title}" does not exist`}
          >
            {part.title}
          </button>
        );
      })}
    </>
  );
}

function WordCount({ content, t }) {
  const stats = useMemo(() => {
    const text = content.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text ? text.split('\n').length : 0;
    return { words, chars, lines };
  }, [content]);

  return (
    <div className={styles.wordCount}>
      <span>{stats.words} {t('status.words')}</span>
      <span className={styles.divider}>|</span>
      <span>{stats.chars} {t('status.chars')}</span>
      <span className={styles.divider}>|</span>
      <span>{stats.lines} {t('status.lines')}</span>
    </div>
  );
}

export function Workspace({
  note,
  onTitleChange,
  onContentChange,
  onDelete,
  notes,
  onLinkClick,
  viewMode = 'split',
  onViewModeChange
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Export to PDF handler
  const handleExportPdf = useCallback(async () => {
    if (!note || exporting) return;

    try {
      setExporting(true);
      await exportToPdf({
        ...note,
        title: title || note.title,
        content: content || note.content
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [note, title, content, exporting]);

  // Handle version restore
  const handleVersionRestore = useCallback((restoredNote) => {
    setTitle(restoredNote.title);
    setContent(restoredNote.content);
    setSaveStatus(t('workspace.saved'));
    setShowVersionHistory(false);
  }, [t]);

  // Sync state with note prop
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus('');
    } else {
      setTitle('');
      setContent('');
    }
  }, [note?.id]);

  // Handle title change with autosave
  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);
    setSaveStatus('');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (newTitle.trim()) {
        setSaveStatus(t('workspace.saving'));
        onTitleChange(newTitle);
        setTimeout(() => setSaveStatus(t('workspace.saved')), 500);
      }
    }, 800);
  }, [onTitleChange, t]);

  // Handle content change with autosave
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setSaveStatus('');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus(t('workspace.saving'));
      onContentChange(newContent);
      setTimeout(() => setSaveStatus(t('workspace.saved')), 500);
    }, 800);
  }, [onContentChange, t]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!note) {
    return (
      <div className={styles.workspace}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <p>{t('workspace.selectNote')}</p>
          <p className={styles.emptyHint}>{t('workspace.linkHint')}</p>
        </div>
      </div>
    );
  }

  const hasLinks = /\[\[.+\]\]/.test(content);

  const renderEditor = () => (
    <div className={styles.editorPane}>
      <div className={styles.paneHeader}>
        <span>{t('workspace.editor')}</span>
      </div>
      <textarea
        ref={editorRef}
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder={t('workspace.linkHint')}
        className={styles.editor}
        spellCheck={false}
      />
    </div>
  );

  const renderPreview = () => (
    <div className={styles.previewPane}>
      <div className={styles.paneHeader}>
        <span>{t('workspace.preview')}</span>
        {hasLinks && <span className={styles.linkBadge}>{t('workspace.hasLinks')}</span>}
      </div>
      <div className={styles.preview}>
        {content ? (
          hasLinks ? (
            <LinkRenderer
              content={content}
              notes={notes}
              onLinkClick={onLinkClick}
            />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {content}
            </ReactMarkdown>
          )
        ) : (
          <p className={styles.previewEmpty}>{t('workspace.preview')}...</p>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.workspace}>
      {/* Title bar */}
      <div className={styles.titleBar}>
        <div className={styles.titleWrapper}>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={t('workspace.untitled')}
            className={styles.titleInput}
          />
          <span className={styles.titleExt}>.od</span>
        </div>
        <div className={styles.titleActions}>
          <span className={styles.saveStatus}>{saveStatus}</span>

          {/* View mode toggle */}
          <div className={styles.viewModeToggle}>
            <button
              className={`${styles.viewModeBtn} ${viewMode === 'editor' ? styles.active : ''}`}
              onClick={() => onViewModeChange('editor')}
              title={t('workspace.editor')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className={`${styles.viewModeBtn} ${viewMode === 'split' ? styles.active : ''}`}
              onClick={() => onViewModeChange('split')}
              title={`${t('workspace.editor')} + ${t('workspace.preview')}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </button>
            <button
              className={`${styles.viewModeBtn} ${viewMode === 'preview' ? styles.active : ''}`}
              onClick={() => onViewModeChange('preview')}
              title={t('workspace.preview')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          <button
            className={styles.actionBtn}
            onClick={() => setShowHelp(!showHelp)}
            title={t('workspace.markdownHelp')}
          >
            ?
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setShowVersionHistory(true)}
            title={t('versions.title')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleExportPdf}
            disabled={exporting}
            title={t('common.export')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={onDelete}
            title={t('workspace.delete')}
          >
            {t('workspace.delete')}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className={styles.content}>
        {viewMode === 'editor' && renderEditor()}

        {viewMode === 'preview' && renderPreview()}

        {viewMode === 'split' && (
          <PanelGroup direction="horizontal" className={styles.panelGroup}>
            <Panel defaultSize={50} minSize={25}>
              {renderEditor()}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandle}>
              <div className={styles.resizeHandleInner} />
            </PanelResizeHandle>
            <Panel defaultSize={50} minSize={25}>
              {renderPreview()}
            </Panel>
          </PanelGroup>
        )}

        {/* Help panel */}
        {showHelp && (
          <div className={styles.helpPane}>
            <div className={styles.helpHeader}>
              <span>Markdown</span>
              <button onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className={styles.helpContent}>
              <div className={styles.helpSection}>
                <h4>Headings</h4>
                <code># Heading 1</code>
                <code>## Heading 2</code>
                <code>### Heading 3</code>
              </div>
              <div className={styles.helpSection}>
                <h4>Text</h4>
                <code>**bold**</code>
                <code>*italic*</code>
                <code>~~strikethrough~~</code>
              </div>
              <div className={styles.helpSection}>
                <h4>Lists</h4>
                <code>- unordered item</code>
                <code>1. ordered item</code>
                <code>- [ ] task item</code>
              </div>
              <div className={styles.helpSection}>
                <h4>Links</h4>
                <code>[[Note Name]]</code>
                <code>[text](url)</code>
                <code>![alt](image-url)</code>
              </div>
              <div className={styles.helpSection}>
                <h4>Code</h4>
                <code>`inline code`</code>
                <code>```language</code>
                <code>code block</code>
                <code>```</code>
              </div>
              <div className={styles.helpSection}>
                <h4>Other</h4>
                <code>&gt; blockquote</code>
                <code>--- horizontal line</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backlinks panel */}
      <div className={styles.backlinksSection}>
        <Backlinks note={note} onNoteClick={onLinkClick} />
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <WordCount content={content} t={t} />
        <div className={styles.statusRight}>
          <span className={styles.fileType}>{t('status.markdown')}</span>
        </div>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && (
        <VersionHistory
          noteId={note.id}
          onRestore={handleVersionRestore}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}
