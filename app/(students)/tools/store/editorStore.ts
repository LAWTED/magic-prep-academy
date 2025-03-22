import { create } from 'zustand';

interface EditorStore {
  // Content state
  content: string;
  setContent: (content: string) => void;
  initialContent: string;
  setInitialContent: (content: string) => void;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;

  // Saving state
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  lastSaved: Date | null;
  setLastSaved: (date: Date | null) => void;

  // UI state
  showDynamicIsland: boolean;
  setShowDynamicIsland: (show: boolean) => void;

  // Timer references (not stored in Zustand but interface defined for typing)
  dynamicIslandTimeoutRef: NodeJS.Timeout | null;
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Content state
  content: "",
  setContent: (content) => set({ content }),
  initialContent: "",
  setInitialContent: (initialContent) => set({ initialContent }),
  isDirty: false,
  setIsDirty: (isDirty) => set({ isDirty }),

  // Saving state
  isSaving: false,
  setIsSaving: (isSaving) => set({ isSaving }),
  lastSaved: null,
  setLastSaved: (lastSaved) => set({ lastSaved }),

  // UI state
  showDynamicIsland: false,
  setShowDynamicIsland: (showDynamicIsland) => set({ showDynamicIsland }),

  // Timer reference
  dynamicIslandTimeoutRef: null,
}));