/**
 * CommandPalette - Quick switcher and command palette (Obsidian-style)
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore, useUIStore } from '../../store';
import styles from './CommandPalette.module.css';

export function CommandPalette() {
  const { t } = useTranslation();
  const { notes, openNoteInTab, createNote, openGraphInTab } = useNoteStore();
  const { showCommandPalette, closeCommandPalette, openCreateModal } = useUIStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter notes based on query
  const filteredNotes = useMemo(() => {
    if (!query.trim()) return notes.slice(0, 10);

    const lowerQuery = query.toLowerCase();
    return notes
      .filter(note =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [notes, query]);

  // Build results list with actions
  const results = useMemo(() => {
    const items = [];

    // Add notes
    filteredNotes.forEach(note => {
      items.push({
        type: 'note',
        id: note.id,
        title: note.title,
        subtitle: note.folder_id ? 'In folder' : '',
        icon: 'note'
      });
    });

    // Add "Create new note" option if query exists
    if (query.trim() && !filteredNotes.some(n => n.title.toLowerCase() === query.toLowerCase())) {
      items.push({
        type: 'create',
        id: 'create-new',
        title: `${t('commandPalette.createNew')} "${query}"`,
        subtitle: 'Shift+Enter',
        icon: 'plus'
      });
    }

    // Add commands
    if (!query.trim() || 'graph'.includes(query.toLowerCase())) {
      items.push({
        type: 'command',
        id: 'open-graph',
        title: t('commandPalette.openGraph'),
        subtitle: '',
        icon: 'graph'
      });
    }

    if (!query.trim() || 'new note'.includes(query.toLowerCase())) {
      items.push({
        type: 'command',
        id: 'new-note',
        title: t('commandPalette.newNote'),
        subtitle: 'Ctrl+N',
        icon: 'plus'
      });
    }

    return items;
  }, [filteredNotes, query, t]);

  // Focus input when opened
  useEffect(() => {
    if (showCommandPalette) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showCommandPalette]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Scroll selected item into view
  useEffect(() => {
    const selected = listRef.current?.children[selectedIndex];
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey && query.trim()) {
          // Create new note with query as title
          handleCreateNote(query.trim());
        } else if (results[selectedIndex]) {
          handleSelect(results[selectedIndex], e.ctrlKey, e.altKey);
        }
        break;
      case 'Escape':
        closeCommandPalette();
        break;
    }
  };

  // Handle item selection
  const handleSelect = (item, ctrlKey = false, altKey = false) => {
    switch (item.type) {
      case 'note':
        openNoteInTab(item.id);
        break;
      case 'create':
        handleCreateNote(query.trim());
        break;
      case 'command':
        if (item.id === 'open-graph') {
          openGraphInTab();
        } else if (item.id === 'new-note') {
          openCreateModal();
        }
        break;
    }
    closeCommandPalette();
  };

  // Create new note
  const handleCreateNote = async (title) => {
    try {
      const newNote = await createNote({ title, content: '' });
      openNoteInTab(newNote.id);
      closeCommandPalette();
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // Render icon
  const renderIcon = (icon) => {
    switch (icon) {
      case 'note':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
        );
      case 'plus':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
      case 'graph':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="18" r="3" />
            <circle cx="18" cy="6" r="3" />
            <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!showCommandPalette) return null;

  return (
    <div className={styles.overlay} onClick={closeCommandPalette}>
      <div className={styles.palette} onClick={e => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.placeholder')}
            className={styles.input}
          />
          <span className={styles.hint}>
            <kbd>↑↓</kbd> navigate <kbd>Enter</kbd> open <kbd>Shift+Enter</kbd> create
          </span>
        </div>

        <div className={styles.results} ref={listRef}>
          {results.length === 0 ? (
            <div className={styles.empty}>{t('commandPalette.noResults')}</div>
          ) : (
            results.map((item, index) => (
              <button
                key={item.id}
                className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className={styles.itemIcon}>{renderIcon(item.icon)}</span>
                <span className={styles.itemTitle}>
                  {item.title}
                  {item.type === 'note' && <span className={styles.itemExt}>.od</span>}
                </span>
                {item.subtitle && (
                  <span className={styles.itemSubtitle}>{item.subtitle}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
