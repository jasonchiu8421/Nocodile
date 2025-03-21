import { create } from "zustand"
import { persist } from "zustand/middleware"
import { BlockInstance } from "@/components/dnd_layout"
import allBlocks from "@/components/preprocessing_blocks"
import { calculateInactiveBlocks } from "@/components/blocks_drawer"
import { allTrainingBlocks, trainingBlocks } from "@/routes/training"

interface BlocksState {
  preprocessingBlocks: BlockInstance[]
  inactivePreprocessingBlocks: string[]
  setPreprocessingBlocks: (blocks: BlockInstance[]) => void

  trainingBlocks: BlockInstance[]
  inactiveTrainingBlocks: string[]
  setTrainingBlocks: (blocks: BlockInstance[]) => void
}

export function defaultPreprocessingBlocks() {
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

export function defaultTrainingBlocks() {
  return [
    {
      id: "block-1",
      type: "start",
      data: {},
      position: { x: 100, y: 100 },
      input: null,
      output: null,
    },
    {
      id: "block-2",
      type: "end",
      data: {},
      position: { x: 500, y: 100 },
      input: null,
      output: null,
    },
  ]
}

export const useBlocksStore = create<BlocksState>()(
  persist(
    (set) => ({
      preprocessingBlocks: defaultPreprocessingBlocks(),
      inactivePreprocessingBlocks: calculateInactiveBlocks(allBlocks, []),

      setPreprocessingBlocks: (blocks) =>
        set(() => ({
          preprocessingBlocks: blocks,
          inactivePreprocessingBlocks: calculateInactiveBlocks(allBlocks, blocks),
        })),

      trainingBlocks: defaultTrainingBlocks(),
      inactiveTrainingBlocks: calculateInactiveBlocks(allTrainingBlocks, []),

      setTrainingBlocks: (blocks) =>
        set(() => ({
          trainingBlocks: blocks,
          inactiveTrainingBlocks: calculateInactiveBlocks(allTrainingBlocks, blocks),
        })),
    }),
    {
      name: "nocodile-blocks-storage",
    }
  )
)
