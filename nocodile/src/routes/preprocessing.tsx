import {
  BlockDrawer
} from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import allBlocks from "@/components/preprocessing_blocks"
import { SaveFunction, splitChain } from "@/components/save_alerts"
import { Toaster } from "@/components/ui/sonner"
import { useBlocksStore } from "@/store"
import { defaultBlocks } from "@/store/useBlocksStore"
import { useEffect, useState } from "react"
import { useProgressStore } from "@/store/useProgressStore"
import { Block } from "@/components/blocks"
import { Button } from "@/components/ui/button"

export default function Preprocessing() {
  const { preprocessingBlocks, setPreprocessingBlocks, inactivePreprocessingBlocks } = useBlocksStore()
  const { isStepCompleted, completeStep } = useProgressStore()
  const isPreprocessingCompleted = isStepCompleted("preprocessing")

  // Check if there's a complete chain from start to end
  const hasCompleteChain = () => {
    const startBlock = preprocessingBlocks.find(block => block.type === "start");
    if (!startBlock) return false;
    
    let currentBlock = startBlock;
    while (currentBlock.output) {
      const nextBlock = preprocessingBlocks.find(block => block.id === currentBlock.output);
      if (!nextBlock) return false;
      if (nextBlock.type === "end") return true;
      currentBlock = nextBlock;
    }
    return false;
  };

  // Create a modified version of allBlocks with our custom End block
  const [modifiedBlocks] = useState(() => {
    const blocks = { ...allBlocks };
    
    // Add a custom start block that reflects whether it's available/completed
    blocks.start = {
      ...blocks.start,
      block: ({id, dragHandleProps}) => {
        // Preprocessing is always available as the first step
        const isAvailable = true;
        const isCompleted = isPreprocessingCompleted;
        
        return (
          <Block
            id={id}
            title="Start"
            color={isCompleted ? "bg-green-100" : isAvailable ? "bg-green-50" : "bg-gray-100"}
            icon={<div className={`w-4 h-4 rounded-full ${isCompleted ? "bg-green-500" : isAvailable ? "bg-green-500" : "bg-gray-400"}`} />}
            dragHandleProps={dragHandleProps}
          />
        );
      },
    };
    
    // Override the end block to include a Run button
    blocks.end = {
      ...blocks.end,
      block: ({id, dragHandleProps}) => {
        const canRun = hasCompleteChain();
        const isCompleted = isPreprocessingCompleted;
        
        return (
          <Block
            id={id}
            title="End"
            color={isCompleted ? "bg-green-100" : "bg-red-100"}
            icon={<div className={`w-4 h-4 rounded-full ${isCompleted ? "bg-green-500" : "bg-red-500"}`} />}
            dragHandleProps={dragHandleProps}
          >
            <div className="p-2">
              <Button
                variant="default"
                size="sm"
                className="w-full"
                disabled={!canRun}
                onClick={() => {
                  console.log("Run preprocessing code");
                  completeStep("preprocessing");
                }}
              >
                {isCompleted ? "Run Again" : "Run"}
              </Button>
            </div>
          </Block>
        );
      },
    };
    
    return blocks;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      <BlockDrawer
        blockRegistry={modifiedBlocks}
        inactiveBlocks={inactivePreprocessingBlocks}
        className="flex-1"
      />
    </div>
  )

  const saveFunc = SaveFunction.requireChainCount(1).then(
    SaveFunction.create((_, blocks) => {
      const chain = splitChain(blocks)
      if (chain[0][0].type !== "start") {
        return {
          type: "error",
          message: "The first block must be a start block!",
        }
      } else if (chain[0][chain[0].length - 1].type !== "end") {
        return {
          type: "error",
          message: "The last block must be an end block!",
        }
      }

      return { type: "success" }
    })
  )

  useEffect(() => {
    console.log(JSON.stringify(preprocessingBlocks))
  }, [preprocessingBlocks])

  return (
    <>
      <DndLayout
        title="Data Preprocessing"
        sidebarContent={sidebarContent}
        blockRegistry={modifiedBlocks}
        blocks={preprocessingBlocks}
        setBlocks={setPreprocessingBlocks}
        save={saveFunc}
        defaultBlocks={defaultBlocks}
      />
      <Toaster />
    </>
  )
}
