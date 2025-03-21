import { DndLayout } from "@/components/dnd_layout";
import { SaveFunction } from "@/components/save_alerts";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Database } from "lucide-react";
import { BlockRegistry, BlockType } from "@/components/blocks";
import { Block } from "@/components/blocks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BlockDrawer,
  calculateInactiveBlocks,
} from "@/components/blocks_drawer";
import { Button } from "@/components/ui/button";
import { BlockInstance } from "@/components/dnd_layout";

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
  block: (data, id, dragHandleProps) => (
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

interface DropoutLayer extends BaseLayer {
  type: "Dropout";
  rate: number;
  activation: ActivationType;
}

interface DenseLayer extends BaseLayer {
  type: "Dense";
  units: number;
  activation: ActivationType;
}

type Layer = 
  | ActivationLayer 
  | Conv2DLayer 
  | MaxPooling2DLayer
  | GlobalMaxPooling2DLayer
  | AveragePooling2DLayer
  | GlobalAveragePooling2DLayer
  | BatchNormalizationLayer
  | FlattenLayer
  | DropoutLayer
  | DenseLayer;

// Convolution
const ConvolutionBlock: BlockType<{
  approach: string;
  isKFold: boolean;
  kFold_k: number;
  layers: Layer[];
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Convolution",
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
      title="Convolution"
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
          <Accordion type="multiple" className="space-y-2">
            {data.layers.map((layer, index) => (
              <AccordionItem key={index} value={`layer-${index}`} className="border rounded">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex justify-between w-full items-center">
                    <span>{layer.type}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent accordion from toggling
                        const newLayers = [...data.layers];
                        newLayers.splice(index, 1);
                        setData({ ...data, layers: newLayers });
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 py-2">
                  <div className="space-y-2">
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
                        const newLayers = [...data.layers];
                        newLayers[index] = newLayer;
                        setData({ ...data, layers: newLayers });
                      }}
                      className="w-full p-2 border rounded"
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
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={layer.filters}
                          onChange={(e) => {
                            const newLayers = [...data.layers];
                            newLayers[index] = { ...layer, filters: parseInt(e.target.value) };
                            setData({ ...data, layers: newLayers });
                          }}
                          placeholder="Number of filters"
                          className="w-full p-2 border rounded"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={layer.kernelSize[0]}
                            onChange={(e) => {
                              const newLayers = [...data.layers];
                              newLayers[index] = { 
                                ...layer, 
                                kernelSize: [parseInt(e.target.value), layer.kernelSize[1]] 
                              };
                              setData({ ...data, layers: newLayers });
                            }}
                            placeholder="Kernel size X"
                            className="w-1/2 p-2 border rounded"
                          />
                          <input
                            type="number"
                            value={layer.kernelSize[1]}
                            onChange={(e) => {
                              const newLayers = [...data.layers];
                              newLayers[index] = { 
                                ...layer, 
                                kernelSize: [layer.kernelSize[0], parseInt(e.target.value)] 
                              };
                              setData({ ...data, layers: newLayers });
                            }}
                            placeholder="Kernel size Y"
                            className="w-1/2 p-2 border rounded"
                          />
                        </div>
                      </div>
                    )}

                    {(layer.type === "Conv2D" || layer.type === "Activation") && (
                      <select
                        value={layer.activation}
                        onChange={(e) => {
                          const newLayers = [...data.layers];
                          newLayers[index] = { ...layer, activation: e.target.value as ActivationType };
                          setData({ ...data, layers: newLayers });
                        }}
                        className="w-full p-2 border rounded"
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
                          onChange={(e) => {
                            const newLayers = [...data.layers];
                            newLayers[index] = { 
                              ...layer, 
                              poolSize: [parseInt(e.target.value), layer.poolSize[1]] 
                            };
                            setData({ ...data, layers: newLayers });
                          }}
                          placeholder="Pool size X"
                          className="w-1/2 p-2 border rounded"
                        />
                        <input
                          type="number"
                          value={layer.poolSize[1]}
                          onChange={(e) => {
                            const newLayers = [...data.layers];
                            newLayers[index] = { 
                              ...layer, 
                              poolSize: [layer.poolSize[0], parseInt(e.target.value)] 
                            };
                            setData({ ...data, layers: newLayers });
                          }}
                          placeholder="Pool size Y"
                          className="w-1/2 p-2 border rounded"
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <button
            onClick={() => {
              const newLayer = { type: "Conv2D", filters: 32, kernelSize: [3, 3], activation: "relu" } as Conv2DLayer;
              setData({ ...data, layers: [...data.layers, newLayer] });
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Layer
          </button>
        </div>
      </div>
    </Block>
  ),
};

// Classification
const ClassificationBlock: BlockType<{
  layers: Layer[];
  optimizer: string;
  loss: string;
  lr: number;
  epoch: number;
  batch_size: number;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Classification",
  icon: <Database className="w-5 h-5" />,
  width: 320,
  limit: 1,
  createNew: () => ({
    layers: [
      {
        type: "Dense",
        units: 512,
        activation: "relu"
      },
      {
        type: "Dropout",
        rate: 0.3,
        activation: "relu"
      }
    ],
    optimizer: "Adam",
    loss: "categorical_crossentropy",
    lr: 0.01,
    epoch: 10,
    batch_size: 64
  }),
  block: (data, id, setData, dragHandleProps) => (
    <Block
      id={id}
      title="Classification"
      icon={<Database className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Layers</label>
          <Accordion type="multiple" className="space-y-2">
            {data.layers.map((layer, index) => (
              <AccordionItem key={index} value={`layer-${index}`} className="border rounded">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex justify-between w-full items-center">
                    <span>{layer.type}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent accordion from toggling
                        const newLayers = [...data.layers];
                        newLayers.splice(index, 1);
                        setData({ ...data, layers: newLayers });
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 py-2">
                  <div className="space-y-2">
                    <select
                      value={layer.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        let newLayer: Layer;
                        
                        switch (newType) {
                          case "Dense":
                            newLayer = { type: "Dense", units: 512, activation: "relu" };
                            break;
                          case "Dropout":
                            newLayer = { type: "Dropout", rate: 0.3, activation: "relu" };
                            break;
                          default:
                            return;
                        }
                        const newLayers = [...data.layers];
                        newLayers[index] = newLayer;
                        setData({ ...data, layers: newLayers });
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="Dense">Dense</option>
                      <option value="Dropout">Dropout</option>
                    </select>

                    {layer.type === "Dense" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">Units</label>
                        <input
                          type="number"
                          value={(layer as DenseLayer).units}
                          onChange={(e) => {
                            const newLayers = [...data.layers];
                            newLayers[index] = { ...layer, units: parseInt(e.target.value) };
                            setData({ ...data, layers: newLayers });
                          }}
                          placeholder="Number of units"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    )}

                    {layer.type === "Dropout" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">Rate</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={(layer as DropoutLayer).rate}
                          onChange={(e) => {
                            const newLayers = [...data.layers];
                            newLayers[index] = { ...layer, rate: parseFloat(e.target.value) };
                            setData({ ...data, layers: newLayers });
                          }}
                          placeholder="Dropout rate"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    )}

                    <label className="block text-sm font-medium mb-1">Activation</label>
                    <select
                      value={layer.type === "Dense" || layer.type === "Dropout" ? layer.activation : "relu"}
                      onChange={(e) => {
                        const newLayers = [...data.layers];
                        if (layer.type === "Dense" || layer.type === "Dropout") {
                          newLayers[index] = { ...layer, activation: e.target.value as ActivationType };
                          setData({ ...data, layers: newLayers });
                        }
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="relu">ReLU</option>
                      <option value="softmax">Softmax</option>
                      <option value="tanh">Tanh</option>
                    </select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <button
            onClick={() => {
              const newLayer = { type: "Dense", units: 512, activation: "relu" } as DenseLayer;
              setData({ ...data, layers: [...data.layers, newLayer] });
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Layer
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Optimizer</label>
          <select
            value={data.optimizer}
            onChange={(e) => setData({ ...data, optimizer: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="Adam">Adam</option>
            <option value="SGD">SGD</option>
            <option value="RMSprop">RMSprop</option>
            <option value="Adagrad">Adagrad</option>
            <option value="Adadelta">Adadelta</option>
            <option value="Nadam">Nadam</option>
            <option value="Ftrl">Ftrl</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Loss</label>
          <select
            value={data.loss}
            onChange={(e) => setData({ ...data, loss: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="categorical_crossentropy">categorical_crossentropy</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Learning Rate:</label>
            <input
              type="number"
              min="0.001"
              max="0.1"
              step="0.001"
              value={data.lr}
              onChange={(e) => setData({ ...data, lr: parseFloat(e.target.value) })}
              className="w-20 p-1 border rounded text-right"
            />
          </div>
          <input
            type="range"
            min="0.001"
            max="0.1"
            step="0.001"
            value={data.lr}
            onChange={(e) => setData({ ...data, lr: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Epochs:</label>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={data.epoch}
              onChange={(e) => setData({ ...data, epoch: parseInt(e.target.value) })}
              className="w-20 p-1 border rounded text-right"
            />
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={data.epoch}
            onChange={(e) => setData({ ...data, epoch: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Batch Size:</label>
            <input
              type="number"
              min="8"
              max="256"
              step="8"
              value={data.batch_size}
              onChange={(e) => setData({ ...data, batch_size: parseInt(e.target.value) })}
              className="w-20 p-1 border rounded text-right"
            />
          </div>
          <input
            type="range"
            min="8"
            max="256"
            step="8"
            value={data.batch_size}
            onChange={(e) => setData({ ...data, batch_size: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </Block>
  ),
};

// Block registry for performance blocks
const performanceBlocks: BlockRegistry = {
  //placeholder: PlaceholderBlock,
  convolution: ConvolutionBlock,
  classification: ClassificationBlock,
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
      width: 100,
      limit: 1,
      createNew: () => ({}),
      block: (_: any, id: string, _setData: any, dragHandleProps?: any) => (
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
      width: 100,
      limit: 1,
      createNew: () => ({}),
      block: (_: any, id: string, _setData: any, dragHandleProps?: any) => (
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
