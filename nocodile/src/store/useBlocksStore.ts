import { create } from "zustand"
import { BlockInstance } from "@/components/dnd_layout"
import allBlocks from "@/components/preprocessing_blocks"
import { calculateInactiveBlocks } from "@/components/blocks_drawer"

interface BlocksState {
  // Blocks currently on the canvas
  blocks: BlockInstance[]
  // Blocks that are inactive (not available to be added)
  inactiveBlocks: string[]
  // Actions
  setBlocks: (blocks: BlockInstance[]) => void
  addBlock: (blockType: string) => void
  removeBlock: (id: string) => void
  updateBlockData: (id: string, data: any) => void
  connectBlock: (block: BlockInstance) => void
}

export const useBlocksStore = create<BlocksState>((set) => ({
  blocks: [],
  inactiveBlocks: calculateInactiveBlocks(allBlocks, []),

  setBlocks: (blocks) =>
    set(() => ({
      blocks,
      inactiveBlocks: calculateInactiveBlocks(allBlocks, blocks),
    })),

  addBlock: (blockType) =>
    set((state) => {
      const newBlock: BlockInstance = {
        id: `${blockType}-${Date.now()}`,
        type: blockType,
        data: allBlocks[blockType].createNew(),
        position: { x: 100, y: 100 },
        input: null,
        output: null,
      }

      const updatedBlocks = [...state.blocks, newBlock]

      return {
        blocks: updatedBlocks,
        inactiveBlocks: calculateInactiveBlocks(allBlocks, updatedBlocks),
      }
    }),

  removeBlock: (id) =>
    set((state) => {
      const updatedBlocks = state.blocks.filter((block) => block.id !== id)

      return {
        blocks: updatedBlocks,
        inactiveBlocks: calculateInactiveBlocks(allBlocks, updatedBlocks),
      }
    }),

  updateBlockData: (id, data) =>
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id ? { ...block, data: { ...block.data, ...data } } : block
      ),
    })),

  connectBlock: (block) =>
    set((state) => ({
      blocks: [
        ...state.blocks
          .filter((b) => b.id !== block.id)
          .map((b) => {
            if (b.id === block.input) {
              return {
                ...b,
                input: b.input === block.id ? null : b.input,
                output: block.id,
              }
            } else if (b.id === block.output) {
              return {
                ...b,
                input: block.id,
                output: b.output === block.id ? null : b.output,
              }
            }

            return {
              ...b,
              input: b.input === block.id ? null : b.input,
              output: b.output === block.id ? null : b.output,
            }
          }),
        block,
      ],
    })),
}))
