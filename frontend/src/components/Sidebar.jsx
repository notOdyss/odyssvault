/**
 * Sidebar - notes list with folders, drag & drop, and .od extension
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Settings } from './Settings';
import { UserMenu } from './Auth';
import { VaultSelector } from './VaultSelector';
import { useAuthStore, useUIStore } from '../store';
import styles from '../styles/Sidebar.module.css';

const ItemTypes = {
  NOTE: 'note',
  FOLDER: 'folder'
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Draggable note item
function DraggableNote({ note, isActive, onSelect, onMoveToFolder, onContextMenu, t }) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.NOTE,
    item: { id: note.id, type: ItemTypes.NOTE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <button
      ref={drag}
      className={`${styles.item} ${isActive ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
      onClick={() => onSelect(note.id)}
      onContextMenu={(e) => onContextMenu(e, note)}
    >
      <div className={styles.itemContent}>
        <span className={styles.itemTitle}>{note.title || t('workspace.untitled')}</span>
        <span className={styles.itemExt}>.od</span>
      </div>
      <span className={styles.itemDate}>{formatDate(note.updated_at)}</span>
    </button>
  );
}

// Droppable folder
function DroppableFolder({ folder, isActive, isExpanded, noteCount, onSelect, onToggle, onMoveNoteToFolder, children, onContextMenu }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.NOTE,
    drop: (item) => {
      onMoveNoteToFolder(item.id, folder.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isDropTarget = isOver && canDrop;

  return (
    <div ref={drop} className={styles.folderGroup}>
      <button
        className={`${styles.folderHeader} ${isActive ? styles.activeFolder : ''} ${isDropTarget ? styles.dropTarget : ''}`}
        onClick={() => {
          onSelect(folder.id);
          onToggle(folder.id);
        }}
        onContextMenu={(e) => onContextMenu(e, folder)}
      >
        <span className={styles.folderIcon}>
          {isExpanded ? '📂' : '📁'}
        </span>
        <span className={styles.folderName}>{folder.name}</span>
        <span className={styles.count}>{noteCount}</span>
      </button>
      {isExpanded && children}
    </div>
  );
}

// Root drop zone (move to root)
function RootDropZone({ isActive, onSelect, noteCount, onMoveNoteToRoot, children, t }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.NOTE,
    drop: (item) => {
      onMoveNoteToRoot(item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isDropTarget = isOver && canDrop;

  return (
    <div ref={drop}>
      <button
        className={`${styles.folderHeader} ${isActive ? styles.activeFolder : ''} ${isDropTarget ? styles.dropTarget : ''}`}
        onClick={() => onSelect(null)}
      >
        <span className={styles.folderIcon}>📋</span>
        <span className={styles.folderName}>{t('sidebar.allNotes')}</span>
        <span className={styles.count}>{noteCount}</span>
      </button>
      {children}
    </div>
  );
}

function SidebarContent({
  notes,
  folders,
  activeNoteId,
  activeFolderId,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onNewNote,
  onFolderSelect,
  collapsed,
  onToggleCollapse,
  theme,
  onThemeChange,
  onCreateFolder,
  onDeleteFolder,
  onOpenGraph,
  onMoveNoteToFolder,
  onContextMenu,
  onOpenPlugins,
  onOpenImport
}) {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const { isAuthenticated } = useAuthStore();
  const { openAuthModal, openContextMenu } = useUIStore();

  const handleSidebarContextMenu = useCallback((e) => {
    // Only show context menu if clicking on empty space (not on notes or folders)
    if (e.target.closest(`.${styles.item}`) || e.target.closest(`.${styles.folderHeader}`)) {
      return;
    }
    e.preventDefault();
    openContextMenu('sidebar', e.clientX, e.clientY, null);
  }, [openContextMenu]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Group notes by folder
  const rootNotes = notes.filter(n => !n.folder_id);
  const notesByFolder = folders.reduce((acc, folder) => {
    acc[folder.id] = notes.filter(n => n.folder_id === folder.id);
    return acc;
  }, {});

  const handleMoveNoteToRoot = useCallback((noteId) => {
    onMoveNoteToFolder(noteId, null);
  }, [onMoveNoteToFolder]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Collapse toggle */}
      <button
        className={styles.collapseBtn}
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '»' : '«'}
      </button>

      {!collapsed && (
        <>
          {/* Header */}
          <div className={styles.header}>
            <span className={styles.title}>{t('sidebar.title')}</span>
            <div className={styles.headerActions}>
              <button
                className={styles.graphBtn}
                onClick={onOpenGraph}
                title={t('sidebar.graphView')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="18" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
                  <line x1="15.5" y1="6" x2="8.5" y2="6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className={styles.search}>
            <input
              type="text"
              placeholder={t('sidebar.search')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearBtn} onClick={() => onSearchChange('')}>
                ×
              </button>
            )}
          </div>

          {/* Vault Selector */}
          {isAuthenticated && (
            <div className={styles.vaultSection}>
              <VaultSelector />
            </div>
          )}

          {/* Notes list */}
          <div className={styles.list} onContextMenu={handleSidebarContextMenu}>
            {/* All Notes option */}
            <RootDropZone
              isActive={activeFolderId === null}
              onSelect={onFolderSelect}
              noteCount={notes.length}
              onMoveNoteToRoot={handleMoveNoteToRoot}
              t={t}
            >
              {/* Root notes when All Notes is selected */}
              {activeFolderId === null && rootNotes.map(note => (
                <DraggableNote
                  key={note.id}
                  note={note}
                  isActive={note.id === activeNoteId}
                  onSelect={onNoteSelect}
                  onMoveToFolder={onMoveNoteToFolder}
                  onContextMenu={(e, n) => onContextMenu?.(e, 'note', n)}
                  t={t}
                />
              ))}
            </RootDropZone>

            {/* Folders */}
            {folders.map(folder => (
              <DroppableFolder
                key={folder.id}
                folder={folder}
                isActive={activeFolderId === folder.id}
                isExpanded={expandedFolders.has(folder.id)}
                noteCount={notesByFolder[folder.id]?.length || 0}
                onSelect={onFolderSelect}
                onToggle={toggleFolder}
                onMoveNoteToFolder={onMoveNoteToFolder}
                onContextMenu={(e, f) => onContextMenu?.(e, 'folder', f)}
              >
                {notesByFolder[folder.id]?.map(note => (
                  <DraggableNote
                    key={note.id}
                    note={note}
                    isActive={note.id === activeNoteId}
                    onSelect={onNoteSelect}
                    onMoveToFolder={onMoveNoteToFolder}
                    onContextMenu={(e, n) => onContextMenu?.(e, 'note', n)}
                    t={t}
                  />
                ))}
              </DroppableFolder>
            ))}

            {notes.length === 0 && (
              <div className={styles.empty}>
                {searchQuery ? t('sidebar.noMatches') : t('sidebar.noNotes')}
              </div>
            )}
          </div>

          {/* User section */}
          <div className={styles.userSection}>
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <button className={styles.loginBtn} onClick={openAuthModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {t('auth.login')}
              </button>
            )}
          </div>

          {/* Settings at bottom */}
          <Settings
            isOpen={settingsOpen}
            onToggle={() => setSettingsOpen(!settingsOpen)}
            currentTheme={theme}
            onThemeChange={onThemeChange}
            folders={folders}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onOpenPlugins={onOpenPlugins}
            onOpenImport={onOpenImport}
          />
        </>
      )}
    </aside>
  );
}

// Export wrapped in DndProvider
export function Sidebar(props) {
  return (
    <DndProvider backend={HTML5Backend}>
      <SidebarContent {...props} />
    </DndProvider>
  );
}
