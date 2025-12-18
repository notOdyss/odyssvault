import { create } from 'zustand';
import { notesApi, foldersApi, graphApi } from '../services/api';

export const useNoteStore = create((set, get) => ({
  notes: [],
  folders: [],
  activeNoteId: null,
  activeFolderId: null,
  openTabs: [],
  activeTabId: null,
  graphData: { nodes: [], edges: [] },
  loading: true,
  error: null,

  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find(n => n.id === activeNoteId) || null;
  },

  getFilteredNotes: (searchQuery) => {
    const { notes, activeFolderId } = get();
    return notes.filter(note => {
      const matchesSearch = !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = activeFolderId === null || note.folder_id === activeFolderId;
      return matchesSearch && matchesFolder;
    });
  },

  getNotesByFolder: () => {
    const { notes, folders } = get();
    const grouped = { root: notes.filter(n => !n.folder_id) };
    folders.forEach(folder => {
      grouped[folder.id] = notes.filter(n => n.folder_id === folder.id);
    });
    return grouped;
  },

  fetchData: async (vaultId = null) => {
    try {
      set({ loading: true, error: null });
      const [notesData, foldersData] = await Promise.all([
        notesApi.getAll(null, vaultId),
        foldersApi.getAll(vaultId)
      ]);
      set({ notes: notesData, folders: foldersData, loading: false });
    } catch (err) {
      set({ error: 'Failed to load data', loading: false });
      console.error('Failed to fetch data:', err);
    }
  },

  fetchGraphData: async (vaultId = null) => {
    try {
      const data = await graphApi.getData(vaultId);
      set({ graphData: data });
      return data;
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
      return { nodes: [], edges: [] };
    }
  },

  setActiveNoteId: (id) => set({ activeNoteId: id }),

  createNote: async (noteData) => {
    try {
      const newNote = await notesApi.create(noteData);
      set(state => ({
        notes: [newNote, ...state.notes],
        activeNoteId: newNote.id
      }));
      return newNote;
    } catch (err) {
      console.error('Failed to create note:', err);
      throw err;
    }
  },

  updateNote: async (noteId, data) => {
    try {
      const updated = await notesApi.update(noteId, data);
      set(state => ({
        notes: state.notes.map(n => n.id === noteId ? updated : n)
      }));
      return updated;
    } catch (err) {
      console.error('Failed to update note:', err);
      throw err;
    }
  },

  deleteNote: async (noteId) => {
    try {
      await notesApi.delete(noteId);
      set(state => ({
        notes: state.notes.filter(n => n.id !== noteId),
        activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
        openTabs: state.openTabs.filter(t => !(t.type === 'note' && t.id === noteId))
      }));
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw err;
    }
  },

  moveNoteToFolder: async (noteId, folderId) => {
    try {
      const updated = await notesApi.update(noteId, { folder_id: folderId || 0 });
      set(state => ({
        notes: state.notes.map(n => n.id === noteId ? updated : n)
      }));
      return updated;
    } catch (err) {
      console.error('Failed to move note:', err);
      throw err;
    }
  },

  setActiveFolderId: (id) => set({ activeFolderId: id }),

  createFolder: async (name, parentId = null) => {
    try {
      const newFolder = await foldersApi.create({ name, parent_id: parentId });
      set(state => ({ folders: [...state.folders, newFolder] }));
      return newFolder;
    } catch (err) {
      console.error('Failed to create folder:', err);
      throw err;
    }
  },

  deleteFolder: async (folderId) => {
    try {
      await foldersApi.delete(folderId);
      // Refresh notes to update folder assignments
      const notesData = await notesApi.getAll();
      set(state => ({
        folders: state.folders.filter(f => f.id !== folderId),
        notes: notesData,
        activeFolderId: state.activeFolderId === folderId ? null : state.activeFolderId
      }));
    } catch (err) {
      console.error('Failed to delete folder:', err);
      throw err;
    }
  },

  openTab: (tab) => {
    set(state => {
      const existingTab = state.openTabs.find(t => t.id === tab.id && t.type === tab.type);
      if (existingTab) {
        return { activeTabId: tab.id };
      }
      return {
        openTabs: [...state.openTabs, tab],
        activeTabId: tab.id
      };
    });
  },

  closeTab: (tabId) => {
    set(state => {
      const newTabs = state.openTabs.filter(t => t.id !== tabId);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === tabId) {
        const closedIndex = state.openTabs.findIndex(t => t.id === tabId);
        newActiveTabId = newTabs[closedIndex]?.id || newTabs[closedIndex - 1]?.id || null;
      }

      return {
        openTabs: newTabs,
        activeTabId: newActiveTabId,
        activeNoteId: newActiveTabId
      };
    });
  },

  setActiveTab: (tabId) => {
    set(state => {
      const tab = state.openTabs.find(t => t.id === tabId);
      return {
        activeTabId: tabId,
        activeNoteId: tab?.type === 'note' ? tabId : state.activeNoteId
      };
    });
  },

  openNoteInTab: (noteId) => {
    const { notes, openTab, setActiveNoteId } = get();
    const note = notes.find(n => n.id === noteId);
    if (note) {
      openTab({ id: note.id, type: 'note', title: note.title });
      setActiveNoteId(noteId);
    }
  },

  openGraphInTab: () => {
    const { openTab, fetchGraphData } = get();
    openTab({ id: 'graph', type: 'graph', title: 'Graph View' });
    fetchGraphData();
  }
}));

export default useNoteStore;
