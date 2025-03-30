import { SaveFunction, splitChain } from "@/components/save_alerts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Pencil } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps } from "./blocks"
import { EndBlockComponent } from "./common_blocks"
import {
  GrayscaleFilterBlock,
  ResizeFilterBlock
} from "./preprocessing_blocks"

export const saveFunc = SaveFunction.requireChainCount(1).then(
  SaveFunction.create((_: any, blocks: any) => {
    const chain = splitChain(blocks)
  
    if (chain[0][0].type !== "start") {
      return {
        type: "error",
        message: "The first block must be a Start block",
      }
    }

    if (chain[0][chain[0].length - 1].type !== "end") {
      return {
        type: "error",
        message: "The last block must be an End block",
      }
    }

    return { type: "success" }
  })
)

const StartBlock: BlockType<{}> = {
  hasOutput: true,
  title: "Start",
  icon: <div className="w-4 h-4 rounded-full bg-green-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block({ id, dragHandleProps }) {
    return <Block id={id} title="Start" icon={<div className="w-4 h-4 rounded-full bg-green-500" />} color="bg-green-50" dragHandleProps={dragHandleProps} />
  },
}

const EndBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: false,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block: (props) => <EndBlockComponent stage="testing" saveFunc={saveFunc} allBlocks={allTestingBlocks} {...props} />,
}

// DoodlePad Block
type DoodlePadProps = {
  imageData: string | null;
}

// DoodlePad Component
function DoodlePadComponent({ 
  data, 
  id, 
  setData, 
  dragHandleProps 
}: CreateBlockElementProps<DoodlePadProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // If we have saved image data, load it
    if (data.imageData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = data.imageData;
    }
  }, [data.imageData]);
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(false);
    
    // Save the image data
    const imageData = canvas.toDataURL();
    setData({ ...data, imageData });
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear the saved image data
    setData({ ...data, imageData: null });
  };
  
  return (
    <Block
      id={id}
      title="Doodle Pad"
      icon={<Pencil className="w-5 h-5" />}
      color="bg-blue-50"
      dragHandleProps={dragHandleProps}
    >
      <div className="p-2 flex flex-col gap-2">
        <div 
          className={cn(
            "border border-gray-300 rounded-md overflow-hidden",
            "flex items-center justify-center bg-white"
          )}
        >
          <canvas
            ref={canvasRef}
            width={256}
            height={256}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="touch-none"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearCanvas}
          className="w-full"
        >
          Clear
        </Button>
      </div>
    </Block>
  );
}

const DoodlePadBlock: BlockType<DoodlePadProps> = {
  hasInput: true,
  hasOutput: true,
  title: "Doodle Pad",
  icon: <Pencil className="w-5 h-5" />,
  width: 300,
  createNew: () => ({ imageData: null }),
  block: (props) => <DoodlePadComponent {...props} />,
};

// Block registry
const allTestingBlocks: BlockRegistry = {
  start: StartBlock,
  doodlePad: DoodlePadBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  end: EndBlock,
}

export default allTestingBlocks
