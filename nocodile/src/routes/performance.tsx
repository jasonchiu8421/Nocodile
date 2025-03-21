import { DndLayout } from "@/components/dnd_layout";
import { SaveFunction } from "@/components/save_alerts";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  BlockDrawer,
  calculateInactiveBlocks,
} from "@/components/blocks_drawer";
import { Button } from "@/components/ui/button";
import { BlockInstance } from "@/components/dnd_layout";
import { BlockRegistry, BlockType } from "@/components/blocks";
import { Database } from "lucide-react";
import { Block } from "@/components/blocks";

// Define a placeholder block for performance metrics
const PlaceholderBlock: BlockType<{
  field1: string;
  field2: number;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Placeholder",
  icon: <Database className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({ field1: "", field2: 0 }),
  block: (data, id, setData, dragHandleProps) => (
    <Block
      id={id}
      title="Placeholder"
      icon={<Database className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-2 p-4">
        <input
          type="text"
          value={data.field1}
          onChange={(e) => (data.field1 = e.target.value)}
          placeholder="Field 1"
          className="w-full p-2 border rounded"
        />
        

        <input
          type="number"
          value={data.field2}
          onChange={(e) => (data.field2 = parseInt(e.target.value))}
          placeholder="Field 2"
          className="w-full p-2 border rounded"
        />
      </div>
    </Block>
  ),
};

// Layer types
type KernelSize = [number, number];
type PoolSize = [number, number];
type ActivationType = "relu" | "softmax" | "tanh";

interface BaseLayer {
  type: string;
}

interface ActivationLayer extends BaseLayer {
  type: "Activation";
  activation: ActivationType;
}

interface Conv2DLayer extends BaseLayer {
  type: "Conv2D";
  filters: number;
  kernelSize: KernelSize;
  activation: ActivationType;
}

interface MaxPooling2DLayer extends BaseLayer {
  type: "MaxPooling2D";
  poolSize: PoolSize;
}

interface GlobalMaxPooling2DLayer extends BaseLayer {
  type: "GlobalMaxPooling2D";
}

interface AveragePooling2DLayer extends BaseLayer {
  type: "AveragePooling2D";
  poolSize: PoolSize;
}

interface GlobalAveragePooling2DLayer extends BaseLayer {
  type: "GlobalAveragePooling2D";
}

interface BatchNormalizationLayer extends BaseLayer {
  type: "BatchNormalization";
}

interface FlattenLayer extends BaseLayer {
  type: "Flatten";
}

type Layer = 
  | ActivationLayer 
  | Conv2DLayer 
  | MaxPooling2DLayer
  | GlobalMaxPooling2DLayer
  | AveragePooling2DLayer
  | GlobalAveragePooling2DLayer
  | BatchNormalizationLayer
  | FlattenLayer;

  //ilove typestseopicjte??!!!

// Convolution
const ConvolutionBlock: BlockType<{
  approach: string;
  isKFold: boolean;
  kFold_k: number;
  layers: Layer[];
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Convolution Configuration",
  icon: <Database className="w-5 h-5" />,
  width: 320,
  limit: 1,
  createNew: () => ({
    approach: "train_test",
    isKFold: false,
    kFold_k: 5,
    layers: [
      {
        type: "Conv2D",
        filters: 32,
        kernelSize: [3, 3],
        activation: "relu"
      },
      {
        type: "MaxPooling2D",
        poolSize: [2, 2]
      },
      {
        type: "Flatten"
      }
    ]
  }),
  block: (data, id, setData, dragHandleProps) => (
    <Block
      id={id}
      title="Convolution Configuration"
      icon={<Database className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Approach</label>
          <select 
            value={data.approach} 
            onChange={(e) => setData({ ...data, approach: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="train_test">Train test</option>
            <option value="train_test_val">Train test validation</option>
            <option value="kFold_val">K fold validation</option>
          </select>
        </div>

        {data.approach === "kFold_val" && (
          <div>
            <label className="block text-sm font-medium mb-1">K-Fold K Value</label>
            <input
              type="number"
              value={data.kFold_k}
              onChange={(e) => setData({ ...data, kFold_k: parseInt(e.target.value) })}
              min="2"
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Layers</label>
          <div className="space-y-2">
            {data.layers.map((layer, index) => (
              <div key={index} className="border p-2 rounded">
                <select
                  value={layer.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let newLayer: Layer;
                    
                    switch (newType) {
                      case "Activation":
                        newLayer = { type: "Activation", activation: "relu" };
                        break;
                      case "Conv2D":
                        newLayer = { type: "Conv2D", filters: 32, kernelSize: [3, 3], activation: "relu" };
                        break;
                      case "MaxPooling2D":
                        newLayer = { type: "MaxPooling2D", poolSize: [2, 2] };
                        break;
                      case "GlobalMaxPooling2D":
                        newLayer = { type: "GlobalMaxPooling2D" };
                        break;
                      case "AveragePooling2D":
                        newLayer = { type: "AveragePooling2D", poolSize: [2, 2] };
                        break;
                      case "GlobalAveragePooling2D":
                        newLayer = { type: "GlobalAveragePooling2D" };
                        break;
                      case "BatchNormalization":
                        newLayer = { type: "BatchNormalization" };
                        break;
                      case "Flatten":
                        newLayer = { type: "Flatten" };
                        break;
                      default:
                        return;
                    }
                    data.layers[index] = newLayer;
                  }}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="Activation">Activation</option>
                  <option value="Conv2D">Conv2D</option>
                  <option value="MaxPooling2D">MaxPooling2D</option>
                  <option value="GlobalMaxPooling2D">GlobalMaxPooling2D</option>
                  <option value="AveragePooling2D">AveragePooling2D</option>
                  <option value="GlobalAveragePooling2D">GlobalAveragePooling2D</option>
                  <option value="BatchNormalization">BatchNormalization</option>
                  <option value="Flatten">Flatten</option>
                </select>

                {layer.type === "Conv2D" && (
                  <>
                    <input
                      type="number"
                      value={layer.filters}
                      onChange={(e) => layer.filters = parseInt(e.target.value)}
                      placeholder="Number of filters"
                      className="w-full p-2 border rounded mb-2"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={layer.kernelSize[0]}
                        onChange={(e) => layer.kernelSize[0] = parseInt(e.target.value)}
                        placeholder="Kernel size X"
                        className="w-1/2 p-2 border rounded"
                      />
                      <input
                        type="number"
                        value={layer.kernelSize[1]}
                        onChange={(e) => layer.kernelSize[1] = parseInt(e.target.value)}
                        placeholder="Kernel size Y"
                        className="w-1/2 p-2 border rounded"
                      />
                    </div>
                  </>
                )}

                {(layer.type === "Conv2D" || layer.type === "Activation") && (
                  <select
                    value={layer.activation}
                    onChange={(e) => layer.activation = e.target.value as ActivationType}
                    className="w-full p-2 border rounded mt-2"
                  >
                    <option value="relu">ReLU</option>
                    <option value="softmax">Softmax</option>
                    <option value="tanh">Tanh</option>
                  </select>
                )}

                {(layer.type === "MaxPooling2D" || layer.type === "AveragePooling2D") && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={layer.poolSize[0]}
                      onChange={(e) => layer.poolSize[0] = parseInt(e.target.value)}
                      placeholder="Pool size X"
                      className="w-1/2 p-2 border rounded"
                    />
                    <input
                      type="number"
                      value={layer.poolSize[1]}
                      onChange={(e) => layer.poolSize[1] = parseInt(e.target.value)}
                      placeholder="Pool size Y"
                      className="w-1/2 p-2 border rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setData({ ...data, layers: [...data.layers, { type: "Conv2D", filters: 32, kernelSize: [3, 3], activation: "relu" }] })}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Layer
          </button>
        </div>
      </div>
    </Block>
  ),
};

// Block registry for performance blocks
const performanceBlocks: BlockRegistry = {
  //placeholder: PlaceholderBlock,
  convolution: ConvolutionBlock,
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
    localStorage.setItem("performanceLayout", JSON.stringify(blocks));
    console.log(JSON.stringify(blocks)); // Log blocks for debugging
  }, [blocks]);

  // Save ordered blocks to localStorage
  useEffect(() => {
    const orderedBlocks = getOrderedBlocks();
    localStorage.setItem(
      "orderedPerformanceBlocks",
      JSON.stringify(orderedBlocks)
    );
  }, [blocks]);

  // Function to get ordered blocks from start to end
  const getOrderedBlocks = () => {
    const orderedBlocks: BlockInstance[] = [];
    let currentBlock = blocks.find(
      (block: BlockInstance) => block.type === "start"
    );

    while (currentBlock && orderedBlocks.length < blocks.length) {
      orderedBlocks.push(currentBlock);
      currentBlock = blocks.find(
        (block: BlockInstance) => block.input === currentBlock?.id
      );
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
          const nextBlock = blocks.find((b) => b.id === current.output);
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
        message:
          "Could not find a complete chain starting from the Start block",
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
      title: "Start",
      icon: <div className="w-4 h-4 rounded-full bg-green-500" />,
      limit: 1,
      createNew: () => ({}),
      block: (_: any, id: string, setData: (data: any) => void, dragHandleProps?: any) => (
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
      title: "End",
      icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
      limit: 1,
      createNew: () => ({}),
      block: (_: any, id: string, setData: (data: any) => void, dragHandleProps?: any) => (
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
        //description="Configure performance metrics"
        sidebarContent={sidebarContent}
        blockRegistry={allBlocks}
        blocks={blocks}
        setBlocks={setBlocks}
        defaultBlocks={() => []}
        save={save}
      />
      <Toaster />
    </>
  );
}
