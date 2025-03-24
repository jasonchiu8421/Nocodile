import { Block, BlockRegistry, CreateBlockElementProps, BlockType } from "@/components/blocks"
import { BlockDrawer, calculateInactiveBlocks } from "@/components/blocks_drawer"
import { BlockInstance, DndLayout } from "@/components/dnd_layout"
import { SaveFunction } from "@/components/save_alerts"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { useProgressStore } from "@/store/useProgressStore"
import { BarChart2 } from "lucide-react"
import { useEffect, useState } from "react"

// Evaluation Block
const EvaluationBlock: BlockType<{
  metrics: string[];
  showConfusionMatrix: boolean;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Evaluation",
  icon: <BarChart2 className="w-5 h-5" />,
  width: 320,
  limit: 1,
  createNew: () => ({
    metrics: ["accuracy", "precision", "recall"],
    showConfusionMatrix: true,
  }),
  block: ({ id, data, setData, dragHandleProps }: CreateBlockElementProps<{
    metrics: string[];
    showConfusionMatrix: boolean;
  }>) => (
    <Block id={id} title="Evaluation" icon={<BarChart2 className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Metrics</label>
          <div className="space-y-2">
            {["accuracy", "precision", "recall", "f1_score"].map((metric) => (
              <div key={metric} className="flex items-center">
                <input
                  type="checkbox"
                  id={`metric-${metric}`}
                  checked={data.metrics.includes(metric)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setData({ ...data, metrics: [...data.metrics, metric] });
                    } else {
                      setData({
                        ...data,
                        metrics: data.metrics.filter((m: string) => m !== metric),
                      });
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor={`metric-${metric}`} className="text-sm">
                  {metric.replace("_", " ")}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Visualization</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confusion-matrix"
              checked={data.showConfusionMatrix}
              onChange={(e) => {
                setData({ ...data, showConfusionMatrix: e.target.checked });
              }}
              className="mr-2"
            />
            <label htmlFor="confusion-matrix" className="text-sm">
              Show confusion matrix
            </label>
          </div>
        </div>
      </div>
    </Block>
  ),
};

// Block registry for performance blocks
const performanceBlocks: BlockRegistry = {
  evaluation: EvaluationBlock,
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
        position: { x: 100, y: 100 },
        input: null,
        output: null,
      },
      {
        id: "block-2",
        type: "evaluation",
        data: {
          metrics: ["accuracy", "precision", "recall"],
          showConfusionMatrix: true,
        },
        position: { x: 300, y: 100 },
        input: null,
        output: null,
      },
      {
        id: "block-3",
        type: "end",
        data: {},
        position: { x: 500, y: 100 },
        input: null,
        output: null,
      },
    ];
  });

  const [inactiveBlocks, setInactiveBlocks] = useState<string[]>([]);
  const { isStepAvailable, isStepCompleted, completeStep } = useProgressStore();
  const isPerformanceAvailable = isStepAvailable("performance");
  const isPerformanceCompleted = isStepCompleted("performance");

  // Update inactive blocks when blocks change
  useEffect(() => {
    setInactiveBlocks(calculateInactiveBlocks(performanceBlocks, blocks));
  }, [blocks]);

  // Save blocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("performanceLayout", JSON.stringify(blocks));
  }, [blocks]);

  // Check if there's a complete chain from start to end
  const hasCompleteChain = (): boolean => {
    const startBlock = blocks.find((block: BlockInstance) => block.type === "start");
    if (!startBlock) return false;
    
    let currentBlock = startBlock;
    const visitedBlockIds = new Set<string>();
    
    while (currentBlock.output) {
      // If we've seen this block before, we have a circular reference
      if (visitedBlockIds.has(currentBlock.id)) {
        return false;
      }
      
      // Mark this block as visited
      visitedBlockIds.add(currentBlock.id);
      
      const nextBlock = blocks.find((block: BlockInstance) => block.id === currentBlock.output);
      if (!nextBlock) return false;
      if (nextBlock.type === "end") return true;
      currentBlock = nextBlock;
    }
    return false;
  };

  // Save function
  const save = SaveFunction.create((_: any, blocks: BlockInstance[]) => {
    return { type: "success" };
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Performance Blocks</h2>
      <BlockDrawer blockRegistry={performanceBlocks} inactiveBlocks={inactiveBlocks} className="flex-1" />
    </div>
  );

  // Combine with internal blocks
  const allBlocks: BlockRegistry = {
    ...performanceBlocks,
    start: {
      hasOutput: true,
      hasInput: false,
      title: "Start",
      icon: <div className="w-4 h-4 rounded-full bg-green-500" />,
      width: 100,
      limit: 1,
      createNew: () => ({}),
      block: ({ id, dragHandleProps }: CreateBlockElementProps<{}>) => {
        const isAvailable = isStepAvailable("performance");
        const isCompleted = isPerformanceCompleted;
        
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
    },
    end: {
      hasInput: true,
      hasOutput: false,
      title: "End",
      icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
      width: 100,
      limit: 1,
      createNew: () => ({}),
      block: ({ id, dragHandleProps }: CreateBlockElementProps<{}>) => {
        const canRun = hasCompleteChain() && isPerformanceAvailable;
        const isCompleted = isPerformanceCompleted;

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
                  console.log("Run performance code");
                  completeStep("performance");
                }}
              >
                {isCompleted ? "Run Again" : "Run"}
              </Button>
            </div>
          </Block>
        );
      },
    },
  };

  return (
    <>
      <DndLayout
        title="Model Performance"
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
            type: "evaluation",
            data: {
              metrics: ["accuracy", "precision", "recall"],
              showConfusionMatrix: true,
            },
            position: { x: 300, y: 100 },
            input: null,
            output: null,
          },
          {
            id: "block-3",
            type: "end",
            data: {},
            position: { x: 500, y: 100 },
            input: null,
            output: null,
          },
        ]}
        save={save}
      />
      <Toaster />
    </>
  );
}