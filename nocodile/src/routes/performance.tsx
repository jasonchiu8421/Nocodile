import { DndLayout } from "@/components/dnd_layout"
import { SaveFunction } from "@/components/save_alerts"
import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { BlockDrawer, calculateInactiveBlocks } from "@/components/blocks_drawer"
import { Button } from "@/components/ui/button"
import { BlockInstance } from "@/components/dnd_layout"
import { BlockRegistry, BlockType } from "@/components/blocks"
import { Database } from "lucide-react"
import { Block } from "@/components/blocks"

// Define a placeholder block for performance metrics
const PlaceholderBlock: BlockType<{
  field1: string;
  field2: number;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Performance Metrics",
  icon: <Database className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({ field1: "", field2: 0 }),
  block: (data, id, dragHandleProps) => (
    <Block
      id={id}
      title="Performance Metrics"
      icon={<Database className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-2 p-4">
        <input
          type="text"
          value={data.field1}
          onChange={(e) => data.field1 = e.target.value}
          placeholder="Field 1"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          value={data.field2}
          onChange={(e) => data.field2 = parseInt(e.target.value)}
          placeholder="Field 2"
          className="w-full p-2 border rounded"
        />
      </div>
    </Block>
  ),
};

// Block registry for performance blocks
const performanceBlocks: BlockRegistry = {
  placeholder: PlaceholderBlock,
};

export default function PerformanceRoute() {
  const [blocks, setBlocks] = useState(() => {
    // Try to load blocks from localStorage
    const savedLayout = localStorage.getItem("performanceLayout");
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
    setInactiveBlocks(calculateInactiveBlocks(performanceBlocks, blocks));
  }, [blocks]);

  // Save blocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('performanceLayout', JSON.stringify(blocks));
    console.log(JSON.stringify(blocks)); // Log blocks for debugging
  }, [blocks]);

  // Save ordered blocks to localStorage
  useEffect(() => {
    const orderedBlocks = getOrderedBlocks();
    localStorage.setItem('orderedPerformanceBlocks', JSON.stringify(orderedBlocks));
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

  // Save function
  const save = SaveFunction.create((_, blocks) => {
    const chain = blocks.reduce((acc, block) => {
      if (block.type === "start") {
        const chain: BlockInstance[] = [block];
        let current = block;
        
        while (current.output) {
          const nextBlock = blocks.find(b => b.id === current.output);
          if (!nextBlock) break;
          chain.push(nextBlock);
          current = nextBlock;
        }
        return chain;
      }
      return acc;
    }, [] as BlockInstance[]);

    if (chain.length === 0) {
      return {
        type: "error",
        message: "Could not find a complete chain starting from the Start block",
      };
    }

    if (chain[0].type !== "start") {
      return {
        type: "error",
        message: "The first block must be a Start block",
      };
    }

    if (chain[chain.length - 1].type !== "end") {
      return {
        type: "error",
        message: "The last block must be an End block",
      };
    }

    return { type: "success" };
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Performance Blocks</h2>
        <Button 
          variant="default" 
          size="sm"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
      <BlockDrawer
        blockRegistry={performanceBlocks}
        inactiveBlocks={inactiveBlocks}
        className="flex-1"
      />
    </div>
  );

  // Combine with internal blocks
  const allBlocks = {
    ...performanceBlocks,
    start: {
      hasOutput: true,
      hasInput: false,
      title: 'Start',
      icon: <div className="w-4 h-4 rounded-full bg-green-500" />,
      limit: 1,
      createNew: () => ({}),
      block: (_: any, id: string, dragHandleProps?: any) => (
        <Block
          id={id}
          title="Start"
          color="bg-green-50"
          icon={<div className="w-4 h-4 rounded-full bg-green-500" />}
          dragHandleProps={dragHandleProps}
        />
      ),
    },
    end: {
      hasInput: true,
      hasOutput: false,
      title: 'End',
      icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
      limit: 1,
      createNew: () => ({}),
      block: (_: any, id: string, dragHandleProps?: any) => (
        <Block
          id={id}
          title="End"
          color="bg-red-50"
          icon={<div className="w-4 h-4 rounded-full bg-red-500" />}
          dragHandleProps={dragHandleProps}
        />
      ),
    },
  };

  return (
    <>
      <DndLayout
        title="Performance"
        description="Configure performance metrics"
        sidebarContent={sidebarContent}
        blockRegistry={allBlocks}
        blocks={blocks}
        setBlocks={setBlocks}
        save={save}
      />
      <Toaster />
    </>
  );
}