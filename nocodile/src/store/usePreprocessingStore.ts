import { create } from "zustand"

interface PreprocessingState {
  // Track which files are currently being deleted to prevent duplicate delete operations
  deletingFiles: Record<string, boolean>

  // Mark a file as being deleted
  startDeleting: (filePath: string) => void

  // Mark a file as no longer being deleted
  finishDeleting: (filePath: string) => void

  // Check if a file is currently being deleted
  isDeleting: (filePath: string) => boolean
}

export const usePreprocessingStore = create<PreprocessingState>()((set, get) => ({
  deletingFiles: {},

  startDeleting: (filePath: string) =>
    set((state) => ({
      deletingFiles: {
        ...state.deletingFiles,
        [filePath]: true,
      },
    })),

  finishDeleting: (filePath: string) =>
    set((state) => {
      const newDeletingFiles = { ...state.deletingFiles }
      delete newDeletingFiles[filePath]
      return { deletingFiles: newDeletingFiles }
    }),

  isDeleting: (filePath: string) => get().deletingFiles[filePath] === true,
}))
