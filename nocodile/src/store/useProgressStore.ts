import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProgressStep = "preprocessing" | "training" | "performance";

export interface ProgressState {
  // Track completion status for each step
  completedSteps: Record<ProgressStep, boolean>;
  // Check if a step is completed
  isStepCompleted: (step: ProgressStep) => boolean;
  // Mark a step as completed
  completeStep: (step: ProgressStep) => void;
  // Reset a step's completion status
  resetStep: (step: ProgressStep) => void;
  // Check if a step is available (previous step completed)
  isStepAvailable: (step: ProgressStep) => boolean;
  // Reset all progress
  resetAllProgress: () => void;
}

// Define the order of steps
const stepOrder: ProgressStep[] = ["preprocessing", "training", "performance"];

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedSteps: {
        preprocessing: false,
        training: false,
        performance: false,
      },

      isStepCompleted: (step) => {
        return get().completedSteps[step];
      },

      completeStep: (step) => {
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [step]: true,
          },
        }));
      },

      resetStep: (step) => {
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [step]: false,
          },
        }));
      },

      isStepAvailable: (step) => {
        const stepIndex = stepOrder.indexOf(step);
        if (stepIndex === 0) return true; // First step is always available
        
        // Previous step must be completed
        const previousStep = stepOrder[stepIndex - 1];
        return get().completedSteps[previousStep];
      },

      resetAllProgress: () => {
        set({
          completedSteps: {
            preprocessing: false,
            training: false,
            performance: false,
          },
        });
      },
    }),
    {
      name: "nocodile-progress-storage",
    }
  )
);
