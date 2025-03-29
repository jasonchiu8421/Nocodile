import { calculateInactiveBlocks } from "@/components/blocks_drawer"
import { BlockInstance } from "@/components/dnd_layout"
import allPpBlocks from "@/components/blocks/preprocessing_blocks"
import { allTrainingBlocks } from "@/routes/training"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import allPerformanceBlocks from "@/components/blocks/performance_blocks"

interface BlocksState {
  preprocessingBlocks: BlockInstance[]
  inactivePreprocessingBlocks: string[]
  setPreprocessingBlocks: (blocks: BlockInstance[]) => void

  trainingBlocks: BlockInstance[]
  inactiveTrainingBlocks: string[]
  setTrainingBlocks: (blocks: BlockInstance[]) => void

  performanceBlocks: BlockInstance[]
  inactivePerformanceBlocks: string[]
  setPerformanceBlocks: (blocks: BlockInstance[]) => void
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

export function defaultPerformanceBlocks() {
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
      preprocessingBlocks: defaultPreprocessingBlocks(),
      inactivePreprocessingBlocks: calculateInactiveBlocks(allPpBlocks, []),

      setPreprocessingBlocks: (blocks) =>
        set(() => ({
          preprocessingBlocks: blocks,
          inactivePreprocessingBlocks: calculateInactiveBlocks(allPpBlocks, blocks),
        })),

      trainingBlocks: defaultTrainingBlocks(),
      inactiveTrainingBlocks: calculateInactiveBlocks(allTrainingBlocks, []),

      setTrainingBlocks: (blocks) =>
        set(() => ({
          trainingBlocks: blocks,
          inactiveTrainingBlocks: calculateInactiveBlocks(allTrainingBlocks, blocks),
        })),

      performanceBlocks: defaultPerformanceBlocks(),
      inactivePerformanceBlocks: calculateInactiveBlocks(allPerformanceBlocks, []),

      setPerformanceBlocks: (blocks) =>
        set(() => ({
          performanceBlocks: blocks,
          inactivePerformanceBlocks: calculateInactiveBlocks(allPerformanceBlocks, blocks),
        })),
    }),
    {
      name: "nocodile-blocks-storage",
    }
  )
)
