import { BlockInstance } from "@/components/dnd_layout"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type PreprocessingData = {
  uploadPath: string | null
  preprocessedPath: string | null
}

interface BlocksState {
  preprocessingBlocks: BlockInstance[]
  setPreprocessingBlocks: (blocks: BlockInstance[]) => void

  trainingBlocks: BlockInstance[]
  setTrainingBlocks: (blocks: BlockInstance[]) => void

  performanceBlocks: BlockInstance[]
  setPerformanceBlocks: (blocks: BlockInstance[]) => void

  preprocessingData: PreprocessingData
  setPreprocessingData: (data: PreprocessingData | ((prev: PreprocessingData) => PreprocessingData)) => void
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
      setPreprocessingBlocks: (blocks) =>
        set(() => ({
          preprocessingBlocks: blocks,
        })),

      trainingBlocks: defaultTrainingBlocks(),
      setTrainingBlocks: (blocks) =>
        set(() => ({
          trainingBlocks: blocks,
        })),

      performanceBlocks: defaultPerformanceBlocks(),
      setPerformanceBlocks: (blocks) =>
        set(() => ({
          performanceBlocks: blocks,
        })),

      preprocessingData: {
        uploadPath: null,
        preprocessedPath: null,
      },

      setPreprocessingData: (data) =>
        set((state) => ({
          preprocessingData: typeof data === "function" ? data(state.preprocessingData) : data,
        })),
    }),
    {
      name: "nocodile-blocks-storage",
    }
  )
)
