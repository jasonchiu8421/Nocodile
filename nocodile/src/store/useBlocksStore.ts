import { BlockInstance } from "@/components/dnd_layout"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type PreprocessingData = {
  uploadPath: string | null
  preprocessedPath: string | null
}

type TrainingData = {
  modelPath: string | null
}

interface BlocksState {
  preprocessingBlocks: BlockInstance[]
  setPreprocessingBlocks: (blocks: BlockInstance[]) => void

  trainingBlocks: BlockInstance[]
  setTrainingBlocks: (blocks: BlockInstance[]) => void

  predictingBlocks: BlockInstance[]
  setPredictingBlocks: (blocks: BlockInstance[]) => void

  testingBlocks: BlockInstance[]
  setTestingBlocks: (blocks: BlockInstance[]) => void

  preprocessingData: PreprocessingData
  setPreprocessingData: (data: PreprocessingData | ((prev: PreprocessingData) => PreprocessingData)) => void

  trainingData: TrainingData
  setTrainingData: (data: TrainingData | ((prev: TrainingData) => TrainingData)) => void
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
      setPreprocessingBlocks: (blocks) =>
        set(() => ({
          preprocessingBlocks: blocks,
        })),

      trainingBlocks: defaultBlocks(),
      setTrainingBlocks: (blocks) =>
        set(() => ({
          trainingBlocks: blocks,
        })),

      predictingBlocks: defaultBlocks(),
      setPredictingBlocks: (blocks) =>
        set(() => ({
          predictingBlocks: blocks,
        })),

      testingBlocks: defaultBlocks(),
      setTestingBlocks: (blocks) =>
        set(() => ({
          testingBlocks: blocks,
        })),

      preprocessingData: {
        uploadPath: null,
        preprocessedPath: null,
      },

      setPreprocessingData: (data) =>
        set((state) => ({
          preprocessingData: typeof data === "function" ? data(state.preprocessingData) : data,
        })),

      trainingData: {
        modelPath: null,
      },
      setTrainingData: (data) =>
        set((state) => ({
          trainingData: typeof data === "function" ? data(state.trainingData) : data,
        })),
    }),
    {
      name: "nocodile-blocks-storage",
    }
  )
)
