import { ProgressStep } from "@/components/blocks/common_blocks"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export const COMPLETABLE_STEPS = ["preprocessing", "training"]
export type CompletableStep = (typeof COMPLETABLE_STEPS)[number]

interface ProgressState {
  completedSteps: Record<CompletableStep, boolean>
  isStepCompleted: (step: CompletableStep) => boolean
  isStepAvailable: (step: ProgressStep) => boolean
  completeStep: (step: CompletableStep) => void
  resetStep: (step: CompletableStep) => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedSteps: {
        preprocessing: false,
        training: false,
      },
      isStepCompleted: (step: CompletableStep) => get().completedSteps[step],
      isStepAvailable: (step: ProgressStep) => {
        const { completedSteps } = get()
        if (step === "preprocessing") return true
        if (step === "training") return completedSteps.preprocessing
        if (step === "predicting" || step === "testing") return completedSteps.training
        return false
      },
      completeStep: (step: CompletableStep) =>
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [step]: true,
          },
        })),
      resetStep: (step: CompletableStep) =>
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
