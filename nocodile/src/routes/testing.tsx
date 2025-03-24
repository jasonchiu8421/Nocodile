import { BlockDrawer, calculateInactiveBlocks } from "@/components/blocks_drawer"
import { BlockInstance, DndLayout } from "@/components/dnd_layout"
import allBlocks, { saveFunc } from "@/components/testing_blocks"
import { Toaster } from "@/components/ui/sonner"
import { useState, useEffect } from "react"

export default function Testing() {
  // Check if this is the first time the user visits the testing page
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    return localStorage.getItem("testingPageVisited") === null || localStorage.getItem("testingPageVisited") === "false";
  });

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

    // If it's the first visit, create a layout with preprocessing filter blocks
    if (isFirstVisit) {
      // Mark that the user has visited the testing page
      localStorage.setItem("testingPageVisited", "true");
      
      // Create a layout with start, filter blocks, and end blocks
      // Position them in a vertical flow
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
          id: "block-resize",
          type: "resize",
          data: { size: 16 },
          position: { x: 100, y: 220 },
          input: null,
          output: null,
        },
        {
          id: "block-grayscale",
          type: "grayscale",
          data: {},
          position: { x: 100, y: 340 },
          input: null,
          output: null,
        },
        {
          id: "block-normalize",
          type: "normalize",
          data: {},
          position: { x: 100, y: 460 },
          input: null,
          output: null,
        },
        {
          id: "block-shuffling",
          type: "shuffling",
          data: {},
          position: { x: 100, y: 580 },
          input: null,
          output: null,
        },
        {
          id: "block-doodle",
          type: "doodlePad",
          data: { imageData: null },
          position: { x: 400, y: 100 },
          input: null,
          output: null,
        },
        {
          id: "block-2",
          type: "end",
          data: {},
          position: { x: 400, y: 400 },
          input: null,
          output: null,
        },
      ];
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

  // After first render, set isFirstVisit to false
  useEffect(() => {
    if (isFirstVisit) {
      setIsFirstVisit(false);
    }
  }, [isFirstVisit]);

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
