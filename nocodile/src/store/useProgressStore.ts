import { ProgressStep } from "@/components/blocks/common_blocks"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ProgressState {
  completedSteps: Record<ProgressStep, boolean>
  isStepCompleted: (step: ProgressStep) => boolean
  isStepAvailable: (step: ProgressStep) => boolean
  completeStep: (step: ProgressStep) => void
  resetStep: (step: ProgressStep) => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedSteps: {
        preprocessing: false,
        training: false,
        predicting: false,
        testing: false,
      },
      isStepCompleted: (step: ProgressStep) => get().completedSteps[step],
      isStepAvailable: (step: ProgressStep) => {
        const { completedSteps } = get()
        if (step === "preprocessing") return true
        if (step === "training") return completedSteps.preprocessing
        if (step === "predicting") return completedSteps.training
        if (step === "testing") return completedSteps.predicting
        return false
      },
      completeStep: (step: ProgressStep) =>
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [step]: true,
          },
        })),
      resetStep: (step: ProgressStep) =>
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [step]: false,
          },
        })),
    }),
    {
      name: "nocodile-progress-storage",
    }
  )
)
