/**
 * OdyssVault - Main App
 * Feature-rich markdown knowledge management system
 */
import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore, useUIStore, useSettingsStore, useAuthStore } from './store';
import { MainLayout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { CreateNoteModal } from './components/CreateNoteModal';
import { GraphView } from './components/GraphView';
import { CommandPalette } from './components/CommandPalette';
import { HotkeyGuide } from './components/HotkeyGuide';
import { ContextMenu } from './components/ContextMenu';
import { AuthModal, UserMenu } from './components/Auth';
import { PluginManager } from './components/PluginManager';
import { FileImport } from './components/FileImport';
import { exportToPdf } from './utils/pdfExport';
import './styles/global.css';
import styles from './styles/App.module.css';

function App() {
  const { t } = useTranslation();

  // Note store
  const {
    notes,
    folders,
    activeNoteId,
    activeFolderId,
    openTabs,
    activeTabId,
    graphData,
    loading,
    error,
    fetchData,
    fetchGraphData,
    setActiveNoteId,
    setActiveFolderId,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    deleteFolder,
    openTab,
    closeTab,
    setActiveTab,
    openNoteInTab,
    openGraphInTab,
    getFilteredNotes,
    moveNoteToFolder
  } = useNoteStore();

  // UI store
  const {
    sidebarCollapsed,
    showCreateModal,
    showCommandPalette,
    showHotkeyGuide,
    showAuthModal,
    showPluginManager,
    showFileImport,
    viewMode,
    searchQuery,
    contextMenu,
    toggleSidebar,
    openCreateModal,
    closeCreateModal,
    toggleCommandPalette,
    closeCommandPalette,
    openHotkeyGuide,
    closeHotkeyGuide,
    openAuthModal,
    closeAuthModal,
    openPluginManager,
    closePluginManager,
    openFileImport,
    closeFileImport,
    setViewMode,
    setSearchQuery,
    openContextMenu,
    closeContextMenu
  } = useUIStore();

  // Auth store
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    initAuth,
    activeVaultId
  } = useAuthStore();

  // Settings store
  const { initTheme, theme, setTheme, showHotkeyGuideOnStartup } = useSettingsStore();

  // Refs
  const saveTimerRef = useRef(null);
  const hasShownHotkeyGuide = useRef(false);

  // Get active note
  const activeNote = notes.find(n => n.id === activeNoteId);
  const activeTab = openTabs.find(t => t.id === activeTabId);

  // Filter notes by search
  const filteredNotes = getFilteredNotes(searchQuery);

  // Initialize theme and auth
  useEffect(() => {
    initTheme();
    initAuth();
  }, [initTheme, initAuth]);

  // Fetch data when vault changes
  useEffect(() => {
    if (!authLoading) {
      fetchData(activeVaultId);
      fetchGraphData(activeVaultId);
    }
  }, [activeVaultId, authLoading, fetchData, fetchGraphData]);

  // Show hotkey guide on first launch
  useEffect(() => {
    if (!loading && showHotkeyGuideOnStartup && !hasShownHotkeyGuide.current) {
      hasShownHotkeyGuide.current = true;
      openHotkeyGuide();
    }
  }, [loading, showHotkeyGuideOnStartup, openHotkeyGuide]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command palette: Ctrl/Cmd + P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // New note: Ctrl/Cmd + N
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openCreateModal();
        return;
      }

      // Quick switcher: Ctrl/Cmd + O
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Toggle sidebar: Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Toggle view mode: Ctrl/Cmd + E
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        const modes = ['split', 'editor', 'preview'];
        const currentIndex = modes.indexOf(viewMode);
        setViewMode(modes[(currentIndex + 1) % modes.length]);
        return;
      }

      // Close tab: Ctrl/Cmd + W
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId) {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }

      // Show hotkey guide: Ctrl/Cmd + /
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        openHotkeyGuide();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, openCreateModal, toggleSidebar, viewMode, setViewMode, activeTabId, closeTab, openHotkeyGuide]);

  // Autosave function
  const saveNote = useCallback(async (noteId, data) => {
    try {
      await updateNote(noteId, data);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  }, [updateNote]);

  // Handle title change with autosave
  const handleTitleChange = (newTitle) => {
    if (!activeNoteId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (newTitle.trim()) {
        saveNote(activeNoteId, { title: newTitle });
      }
    }, 800);
  };

  // Handle content change with autosave
  const handleContentChange = (newContent) => {
    if (!activeNoteId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNote(activeNoteId, { content: newContent });
    }, 800);
  };

  // Create new note
  const handleCreateNote = async (noteName, folderId) => {
    const newNote = await createNote({
      title: noteName,
      content: '',
      folder_id: folderId,
      vault_id: activeVaultId
    });
    openNoteInTab(newNote.id);
    closeCreateModal();
  };

  // Delete note
  const handleDelete = async () => {
    if (!activeNoteId) return;
    if (!window.confirm('Delete this note?')) return;
    await deleteNote(activeNoteId);
  };

  // Open graph view
  const handleOpenGraph = async () => {
    await fetchGraphData(activeVaultId);
    openGraphInTab();
  };

  // Handle note selection from sidebar
  const handleNoteSelect = (noteId) => {
    openNoteInTab(noteId);
  };

  // Handle link click in preview
  const handleLinkClick = (noteId) => {
    openNoteInTab(noteId);
  };

  // Handle folder creation with vault_id
  const handleCreateFolder = async (folderName) => {
    if (typeof folderName === 'string') {
      // Called from Settings with just a string
      await createFolder({ name: folderName, vault_id: activeVaultId });
    } else {
      // Called with full object
      await createFolder(folderName);
    }
  };

  // Handle file import
  const handleFileImport = async (fileData) => {
    const newNote = await createNote({
      title: fileData.title,
      content: fileData.content,
      vault_id: activeVaultId
    });
    openNoteInTab(newNote.id);
  };

  // New tab (create note)
  const handleNewTab = () => {
    openCreateModal();
  };

  // Handle context menu
  const handleContextMenu = useCallback((e, type, data) => {
    e.preventDefault();
    openContextMenu(type, e.clientX, e.clientY, data);
  }, [openContextMenu]);

  // Context menu actions
  const contextMenuActions = {
    sidebar: [
      {
        id: 'new-note',
        label: t('sidebar.newNote'),
        icon: '📝',
        handler: () => openCreateModal()
      },
      {
        id: 'new-folder',
        label: t('settings.newFolder'),
        icon: '📁',
        handler: async () => {
          const folderName = window.prompt('Folder name:');
          if (folderName && folderName.trim()) {
            await createFolder({ name: folderName.trim(), vault_id: activeVaultId });
          }
        }
      },
      { divider: true },
      {
        id: 'open-graph',
        label: t('sidebar.graphView'),
        icon: '🔗',
        handler: () => handleOpenGraph()
      }
    ],
    note: [
      {
        id: 'open-new-tab',
        label: t('contextMenu.openInNewTab'),
        icon: '📑',
        handler: (note) => openNoteInTab(note.id)
      },
      { divider: true },
      {
        id: 'rename',
        label: t('contextMenu.rename'),
        icon: '✏️',
        handler: (note) => {
          const newTitle = window.prompt(t('contextMenu.rename'), note.title);
          if (newTitle && newTitle.trim()) {
            updateNote(note.id, { title: newTitle.trim() });
          }
        }
      },
      {
        id: 'move-to',
        label: t('contextMenu.moveTo'),
        icon: '📁',
        handler: (note) => {
          // For now, simple move to no folder or first folder
          const targetFolder = note.folder_id ? null : (folders[0]?.id || null);
          moveNoteToFolder(note.id, targetFolder);
        }
      },
      { divider: true },
      {
        id: 'export-pdf',
        label: t('contextMenu.exportPdf'),
        icon: '📄',
        handler: async (note) => {
          try {
            await exportToPdf(note);
          } catch (err) {
            console.error('PDF export failed:', err);
          }
        }
      },
      { divider: true },
      {
        id: 'delete',
        label: t('contextMenu.delete'),
        icon: '🗑️',
        danger: true,
        handler: (note) => {
          if (window.confirm(`Delete "${note.title}"?`)) {
            deleteNote(note.id);
          }
        }
      }
    ],
    folder: [
      {
        id: 'new-note',
        label: t('contextMenu.newNote'),
        icon: '📝',
        handler: (folder) => {
          setActiveFolderId(folder.id);
          openCreateModal();
        }
      },
      { divider: true },
      {
        id: 'delete-folder',
        label: t('contextMenu.deleteFolder'),
        icon: '🗑️',
        danger: true,
        handler: (folder) => {
          if (window.confirm(`Delete folder "${folder.name}"?`)) {
            deleteFolder(folder.id);
          }
        }
      }
    ]
  };

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.app}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  // Determine what to render in main content area
  const renderContent = () => {
    if (!activeTab) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
          </div>
          <h2>{t('welcome.title')}</h2>
          <p>{t('welcome.subtitle')}</p>
          <div className={styles.emptyActions}>
            <button className={styles.primaryBtn} onClick={openCreateModal}>
              {t('welcome.createNote')}
            </button>
            <button className={styles.secondaryBtn} onClick={handleOpenGraph}>
              {t('welcome.openGraph')}
            </button>
          </div>
          <div className={styles.shortcutHint}>
            <kbd>Ctrl</kbd> + <kbd>N</kbd> New Note &nbsp;&nbsp;
            <kbd>Ctrl</kbd> + <kbd>P</kbd> Command Palette &nbsp;&nbsp;
            <kbd>Ctrl</kbd> + <kbd>/</kbd> Shortcuts
          </div>
        </div>
      );
    }

    if (activeTab.type === 'graph') {
      return (
        <GraphView
          graphData={graphData}
          onNodeClick={handleLinkClick}
          isFullView={true}
        />
      );
    }

    return (
      <Workspace
        note={activeNote}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
        onDelete={handleDelete}
        notes={notes}
        onLinkClick={handleLinkClick}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    );
  };

  return (
    <>
      <MainLayout
        sidebar={
          <Sidebar
            notes={filteredNotes}
            folders={folders}
            activeNoteId={activeNoteId}
            activeFolderId={activeFolderId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNoteSelect={handleNoteSelect}
            onNewNote={openCreateModal}
            onFolderSelect={setActiveFolderId}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            theme={theme}
            onThemeChange={setTheme}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={deleteFolder}
            onOpenGraph={handleOpenGraph}
            onMoveNoteToFolder={moveNoteToFolder}
            onContextMenu={handleContextMenu}
            onOpenPlugins={openPluginManager}
            onOpenImport={openFileImport}
          />
        }
        tabs={openTabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTab}
        onTabClose={closeTab}
        onNewTab={handleNewTab}
        sidebarCollapsed={sidebarCollapsed}
      >
        {renderContent()}
      </MainLayout>

      {/* Modals */}
      <CreateNoteModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        onCreate={handleCreateNote}
        folders={folders}
        currentFolderId={activeFolderId}
      />

      <CommandPalette />
      <HotkeyGuide />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          type={contextMenu.type}
          x={contextMenu.x}
          y={contextMenu.y}
          data={contextMenu.data}
          onClose={closeContextMenu}
          actions={contextMenuActions}
        />
      )}

      {/* Plugin Manager */}
      <PluginManager
        isOpen={showPluginManager}
        onClose={closePluginManager}
      />

      {/* File Import */}
      <FileImport
        isOpen={showFileImport}
        onClose={closeFileImport}
        onImport={handleFileImport}
      />
    </>
  );
}

export default App;
