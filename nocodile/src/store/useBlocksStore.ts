import { create } from "zustand"
import { persist } from "zustand/middleware"
import { BlockInstance } from "@/components/dnd_layout"
import allBlocks from "@/components/preprocessing_blocks"
import { calculateInactiveBlocks } from "@/components/blocks_drawer"

interface BlocksState {
  // Blocks currently on the canvas
  preprocessingBlocks: BlockInstance[]
  // Blocks that are inactive (not available to be added)
  inactivePreprocessingBlocks: string[]
  // Actions
  setPreprocessingBlocks: (blocks: BlockInstance[]) => void
}

export function defaultBlocks() {
  return [
    {
      id: "block-1",
      type: "start",
      data: {},
      position: { x: 64, y: 81 },
      input: null,
      output: "block-2",
    },
    {
      id: "block-2",
      type: "end",
      data: {},
      position: { x: 280, y: 81 },
      input: "block-1",
      output: null,
    },
  ]
}

export const useBlocksStore = create<BlocksState>()(
  persist(
    (set) => ({
      preprocessingBlocks: defaultBlocks(),
      inactivePreprocessingBlocks: calculateInactiveBlocks(allBlocks, []),

      setPreprocessingBlocks: (blocks) =>
        set(() => ({
          preprocessingBlocks: blocks,
          inactivePreprocessingBlocks: calculateInactiveBlocks(allBlocks, blocks),
        })),
    }),
    {
      name: "nocodile-blocks-storage",
      partialize: (state) => ({
        preprocessingBlocks: state.preprocessingBlocks,
      }),
    }
  )
)
