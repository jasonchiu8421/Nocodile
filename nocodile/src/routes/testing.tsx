import { BlockDrawer, calculateInactiveBlocks } from "@/components/blocks_drawer"
import { BlockInstance, DndLayout } from "@/components/dnd_layout"
import allBlocks, { saveFunc } from "@/components/testing_blocks"
import { Toaster } from "@/components/ui/sonner"
import { useState, useEffect } from "react"

export default function Testing() {
  const [blocks, setBlocks] = useState<BlockInstance[]>(() => {
    // Try to load blocks from localStorage
    const savedLayout = localStorage.getItem("testingLayout");
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
    ];
  });

  const [inactiveBlocks, setInactiveBlocks] = useState<string[]>([]);

  // Update inactive blocks when blocks change
  useEffect(() => {
    setInactiveBlocks(calculateInactiveBlocks(allBlocks, blocks));
  }, [blocks]);

  // Save blocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("testingLayout", JSON.stringify(blocks));
  }, [blocks]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Testing Blocks</h2>
      <BlockDrawer blockRegistry={allBlocks} inactiveBlocks={inactiveBlocks} className="flex-1" />
    </div>
  );

  return (
    <>
      <DndLayout
        title="Model Testing"
        sidebarContent={sidebarContent}
        blockRegistry={allBlocks}
        blocks={blocks}
        setBlocks={setBlocks}
        defaultBlocks={() => [
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
        ]}
        save={saveFunc}
      />
      <Toaster />
    </>
  );
}
