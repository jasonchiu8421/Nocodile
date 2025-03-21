import { DndLayout } from "@/components/dnd_layout"
import { SaveFunction } from "@/components/save_alerts"
import { useState, useEffect } from "react"
import preprocessingBlocks from "@/components/preprocessing_blocks"
import { Toaster } from "@/components/ui/sonner"
import { BlockDrawer, calculateInactiveBlocks } from "@/components/blocks_drawer"
import { Button } from "@/components/ui/button"
import { BlockInstance } from "@/components/dnd_layout"
import { StartBlock, EndBlock } from "@/components/internal_blocks"

export default function PreprocessingRoute() {
  const [blocks, setBlocks] = useState(() => {
    // Try to load blocks from localStorage
    const savedLayout = localStorage.getItem("blockLayout");
    if (savedLayout) {
      try {
        return JSON.parse(savedLayout);
      } catch (e) {
        console.error("Failed to load saved layout:", e);
      }
    }
    
    // Default blocks if no saved layout - initialize with start and end blocks
    return [
      {
        id: "block-1",
        type: "start",
        data: {},
        position: { x: 100, y: 100 }, // Start block at (100,100)
        input: null,
        output: null,
      },
      {
        id: "block-2",
        type: "end",
        data: {},
        position: { x: 500, y: 100 }, // End block at (500,100)
        input: null,
        output: null,
      },
    ];
  });

  const [inactiveBlocks, setInactiveBlocks] = useState<string[]>([]);

  // Update inactive blocks when blocks change
  useEffect(() => {
    setInactiveBlocks(calculateInactiveBlocks(preprocessingBlocks, blocks));
  }, [blocks]);

  // Function to get ordered blocks from start to end
  const getOrderedBlocks = () => {
    const orderedBlocks: BlockInstance[] = [];
    let currentBlock = blocks.find((block: BlockInstance) => block.type === "start");
    
    while (currentBlock && orderedBlocks.length < blocks.length) {
      orderedBlocks.push(currentBlock);
      currentBlock = blocks.find((block: BlockInstance) => block.input === currentBlock?.id);
    }

    return orderedBlocks;
  };

  // Handler for submit button
  const handleSubmit = () => {
    const orderedBlocks = getOrderedBlocks();
    console.log("orderedCanvasBlocks:", orderedBlocks);
  };

  // Save function that uses the new format
  const save = SaveFunction.formatPreprocessing();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Blocks</h2>
        <Button 
          variant="default" 
          size="sm"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
      <BlockDrawer
        blockRegistry={preprocessingBlocks}
        inactiveBlocks={inactiveBlocks}
        className="flex-1"
      />
    </div>
  );

  // Combine preprocessing blocks with internal blocks for the layout
  const allBlocks = {
    ...preprocessingBlocks,
    start: StartBlock,
    end: EndBlock,
  };

  return (
    <>
      <DndLayout
        title="Preprocessing"
        description="Configure preprocessing steps for your dataset"
        sidebarContent={sidebarContent}
        blockRegistry={allBlocks}
        blocks={blocks}
        setBlocks={setBlocks}
        save={save}
      />
      <Toaster />
    </>
  )
}
