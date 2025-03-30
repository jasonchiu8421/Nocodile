import { SaveFunction, splitChain } from "@/components/save_alerts"
import { predict } from "@/lib/server_hooks"
import { cn, filterOutKeys } from "@/lib/utils"
import { useBlocksStore } from "@/store"
import { Pencil } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps } from "./blocks"
import { EndBlockComponent } from "./common_blocks"
import { GrayscaleFilterBlock, ResizeFilterBlock } from "./preprocessing_blocks"

export const saveFunc = SaveFunction.requireChainCount(1).then(
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
// Keep them duplicated cause it needs different Uhh behavior for each step supposedly but take that time, corners are cut
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

export type EndBlockData = {
  result: null | {
    predictedClass: number[]
    confidenceLevel: number[]
  }
}

const EndAndUploadBlockComponent = (props: CreateBlockElementProps<EndBlockData>) => {
  const { chain, data, setData } = props
  const [isPredicting, setIsPredicting] = useState(false)
  const [doodle, setDoodle] = useState<DoodlePadProps | null>(null)
  const [options, setOptions] = useState<Record<string, any>>({})

  const { trainingData } = useBlocksStore()

  useEffect(() => {
    setDoodle(null)
    const options: Record<string, any> = {}

    if (chain) {
      const doodleBlocks = chain.before.filter((block) => block.type === "doodle")
      const doodleBlock = doodleBlocks.length > 0 ? doodleBlocks[doodleBlocks.length - 1] : null

      if (doodleBlock) {
        const doodleBlockIndex = chain.before.findIndex((block) => block.id === doodleBlock.id)
        setDoodle(doodleBlock.data)

        chain.before.slice(doodleBlockIndex + 1).forEach((block) => {
          if (block.type === "resize") {
            options.resize = block.data.size
          } else if (block.type === "grayscale") {
            options.grayscale = true
          }
        })
      }
    }

    setOptions(options)
  }, [chain])

  const startPrediction = async () => {
    if (isPredicting) return
    if (!doodle) {
      toast.error("Please attach a doodle block to this block!")
      return
    } else if (!trainingData?.modelPath) {
      toast.error("Please first train a model!")
      return
    }

    setIsPredicting(true)
    setData({ result: null })

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    await sleep(500)

    let imageData = doodle.imageData
    if (imageData && imageData.startsWith("data:image/png;base64,")) {
      imageData = imageData.replace("data:image/png;base64,", "")
    }

    await predict({
      model_path: trainingData?.modelPath || "",
      input_data: imageData || "",
      preprocessing_options: {
        ...(options["resize"] ? { resize: [options["resize"] as number, options["resize"] as number] } : {}),
        ...(options["grayscale"] ? { grayscale: true } : {}),
      },
    }).then((response) => {
      if (response.success) {
        setIsPredicting(false)
        toast.success("Prediction successful")
        setData({ result: { predictedClass: response.data["predicted class"], confidenceLevel: response.data["confidence level"] } })
      } else {
        toast.error("Failed to predict", {
          description: response.error,
        })
        setIsPredicting(false)
      }
    })
  }

  return <EndBlockComponent stage="predicting" saveFunc={saveFunc} allBlocks={allPdBlocks} step={startPrediction} data={{}} setData={() => {}} {...filterOutKeys(props, ["data", "setData"])} buttonText={"Predict Dataset"}>
    {data.result && (
      <div>
        <p>Result: {JSON.stringify(data.result)}</p>
      </div>
    )}
  </EndBlockComponent>
}

const EndBlock: BlockType<EndBlockData> = {
  hasInput: true,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({ result: null }),
  block: (props) => <EndAndUploadBlockComponent {...props} />,
}
// DoodlePad Block
type DoodlePadProps = {
  imageData: string | null
}

// DoodlePad Component
function DoodlePadComponent({ data, id, setData, dragHandleProps }: CreateBlockElementProps<DoodlePadProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // If we have saved image data, load it
    if (data.imageData) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = data.imageData
    }
  }, [data.imageData])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "black"

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(false)

    // Save the image data
    const imageData = canvas.toDataURL()
    setData({ ...data, imageData })
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Clear the saved image data
    setData({ ...data, imageData: null })
  }

  return (
    <Block id={id} title="Doodle Pad" icon={<Pencil className="w-5 h-5" />} color="bg-blue-50" dragHandleProps={dragHandleProps}>
      <div className="p-2 flex flex-col gap-2">
        <div className={cn("border border-gray-300 rounded-md overflow-hidden", "flex items-center justify-center bg-white")}>
          <canvas ref={canvasRef} width={256} height={256} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="touch-none" />
        </div>
        <Button variant="outline" size="sm" onClick={clearCanvas} className="w-full">
          Clear
        </Button>
      </div>
    </Block>
  )
}

const DoodlePadBlock: BlockType<DoodlePadProps> = {
  hasInput: true,
  hasOutput: true,
  title: "Doodle Pad",
  icon: <Pencil className="w-5 h-5" />,
  width: 300,
  createNew: () => ({ imageData: null }),
  block: (props) => <DoodlePadComponent {...props} />,
}

// Block registry
const allPdBlocks: BlockRegistry = {
  start: StartBlock,
  doodle: DoodlePadBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  end: EndBlock,
}

export default allPdBlocks
