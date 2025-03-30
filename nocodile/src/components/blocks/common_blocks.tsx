import { SaveFunction } from "@/components/save_alerts"
import { COMPLETABLE_STEPS, useProgressStore } from "@/store/useProgressStore"
import { ReactNode, useState } from "react"
import { Button } from "../ui/button"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps } from "./blocks"

// Use the Step type from useProgressStore
export type ProgressStep = "preprocessing" | "training" | "predicting" | "testing"

/**
 * Common Start Block that can be reused across different pages
 */
export const createStartBlock = (): BlockType<{}> => ({
  hasOutput: true,
  hasInput: false,
  title: "Start",
  icon: <div className="w-4 h-4 rounded-full bg-green-500" />,
  width: 100, // Consistent width for better alignment
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block({ id, dragHandleProps }) {
    return (
      <Block 
        id={id} 
        title="Start" 
        icon={<div className="w-4 h-4 rounded-full bg-green-500" />} 
        color="bg-green-50" 
        dragHandleProps={dragHandleProps} 
      />
    )
  },
})

/**
 * Common End Block that can be reused across different pages
 */
export function EndBlockComponent({
  id,
  blocks,
  dragHandleProps,
  saveFunc,
  stage,
  allBlocks,
  step,
  children,
  buttonText,
}: Omit<CreateBlockElementProps<{}>, "dragging"> & {
  saveFunc: SaveFunction
  stage: ProgressStep
  allBlocks: BlockRegistry
  step?: () => Promise<void>
  children?: ReactNode
  buttonText?: string | ((running: boolean, complete: boolean) => string)
}) {
  const { isStepAvailable, isStepCompleted, completeStep } = useProgressStore()
  const [isRunning, setIsRunning] = useState(false)
  const saveFuncResult = blocks ? saveFunc.save(allBlocks, blocks) : null
  const canRun = saveFuncResult?.type === "success" && isStepAvailable(stage)
  const isCompleted = COMPLETABLE_STEPS.includes(stage) && isStepCompleted(stage)
  const buttonTextFunc = buttonText ?? ((running: boolean, complete: boolean) => (running ? "Running..." : complete ? "Run Again" : "Run"))

  return (
    <Block id={id} title="End" color={isCompleted ? "bg-green-100" : "bg-red-100"} icon={<div className={`w-4 h-4 rounded-full ${isCompleted ? "bg-green-500" : "bg-red-500"}`} />} dragHandleProps={dragHandleProps}>
      <div className="flex flex-col gap-4">
        {saveFuncResult?.type === "error" && <p className="text-xs text-red-900">{saveFuncResult.message}</p>}
        <Button
          variant="default"
          size="sm"
          className="w-full"
          disabled={!canRun || isRunning}
          onClick={async () => {
            setIsRunning(true)

            try {
              await step?.()
            } finally {
              completeStep(stage)
              setIsRunning(false)
            }
          }}
        >
          {typeof buttonTextFunc === "function" ? buttonTextFunc(isRunning, isCompleted) : buttonTextFunc}
        </Button>
        {children}
      </div>
    </Block>
  )
}
