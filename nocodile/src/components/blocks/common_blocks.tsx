import { Block, BlockRegistry, BlockType, CreateBlockElementProps, EndBlockComponent } from "./blocks"
import { SaveFunction } from "@/components/save_alerts"
import { useProgressStore } from "@/store/useProgressStore"

// Use the Step type from useProgressStore
export type ProgressStep = "preprocessing" | "training" | "performance" | "testing"

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
export const createEndBlock = (
  stage: ProgressStep,
  saveFunc: SaveFunction,
  allBlocks: BlockRegistry,
  step?: () => void
): BlockType<{}> => ({
  hasInput: true,
  hasOutput: false,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  width: 100, // Consistent width for better alignment
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block: (props) => (
    <EndBlockComponent 
      stage={stage} 
      saveFunc={saveFunc} 
      allBlocks={allBlocks} 
      step={step} 
      {...props} 
    />
  ),
})
