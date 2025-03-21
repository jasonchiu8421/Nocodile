import { create } from "zustand";
import { persist } from "zustand/middleware";

type Step = "preprocessing" | "training" | "performance" | "testing";

interface ProgressState {
  completedSteps: Record<Step, boolean>;
  isStepCompleted: (step: Step) => boolean;
  isStepAvailable: (step: Step) => boolean;
  completeStep: (step: Step) => void;
  resetStep: (step: Step) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedSteps: {
        preprocessing: false,
        training: false,
        performance: false,
        testing: false,
      },
      isStepCompleted: (step: Step) => get().completedSteps[step],
      isStepAvailable: (step: Step) => {
        const { completedSteps } = get();
        if (step === "preprocessing") return true;
        if (step === "training") return completedSteps.preprocessing;
        if (step === "performance") return completedSteps.training;
        if (step === "testing") return completedSteps.performance;
        return false;
      },
      completeStep: (step: Step) =>
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [step]: true,
          },
        })),
      resetStep: (step: Step) =>
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
);
