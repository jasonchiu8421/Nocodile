import { SaveFunction, splitChain } from "@/components/save_alerts"
import { testModel } from "@/lib/server_hooks"
import { filterOutKeys } from "@/lib/utils"
import { useBlocksStore } from "@/store"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps } from "./blocks"
import { EndBlockComponent } from "./common_blocks"
import { GrayscaleFilterBlock, ImportDataBlock, ImportDataProps, ResizeFilterBlock } from "./preprocessing_blocks"

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

export type EndBlockData = {
  result: null | {
    accuracy: number
    accuracyPerClass: Record<string, number>
    accuracyPerClassGraph: string
  }
}

const EndAndUploadBlockComponent = (props: CreateBlockElementProps<EndBlockData>) => {
  const { chain, data, setData } = props
  const [isPredicting, setIsPredicting] = useState(false)
  const [importData, setImportData] = useState<ImportDataProps | null>(null)
  const [options, setOptions] = useState<Record<string, any>>({})

  const { trainingData } = useBlocksStore()

  useEffect(() => {
    setImportData(null)
    const options: Record<string, any> = {}

    if (chain) {
      const importDataBlocks = chain.before.filter((block) => block.type === "import")
      const importDataBlock = importDataBlocks.length > 0 ? importDataBlocks[importDataBlocks.length - 1] : null

      if (importDataBlock) {
        const importDataBlockIndex = chain.before.findIndex((block) => block.id === importDataBlock.id)
        setImportData(importDataBlock.data)

        chain.before.slice(importDataBlockIndex + 1).forEach((block) => {
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
    if (!importData) {
      toast.error("Please attach an import block to this block!")
      return
    } else if (!trainingData?.modelPath) {
      toast.error("Please first train a model!")
      return
    }

    setIsPredicting(true)
    setData({ result: null })

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    await sleep(500)

    await testModel({
      model_path: trainingData?.modelPath || "",
      dataset_path: importData.datasetFile || "",
      preprocessing_options: {
        ...(options["resize"] ? { resize: [options["resize"] as number, options["resize"] as number] } : {}),
        ...(options["grayscale"] ? { grayscale: true } : {}),
        save_option: "whole dataset",
      },
    }).then((response) => {
      if (response.success) {
        setIsPredicting(false)
        toast.success("Prediction successful")
        setData({ result: { accuracy: response.data["accuracy"], accuracyPerClass: response.data["accuracy per class"], accuracyPerClassGraph: response.data["accuracy per class graph"] } })
      } else {
        toast.error("Failed to predict", {
          description: response.error,
        })
        setIsPredicting(false)
      }
    })
  }

  return (
    <EndBlockComponent stage="predicting" saveFunc={saveFunc} allBlocks={allTestingBlocks} step={startPrediction} data={{}} setData={() => {}} {...filterOutKeys(props, ["data", "setData"])} buttonText={"Test Dataset"}>
      {data.result && (
        <div>
          <p>Result: {JSON.stringify(data.result)}</p>
        </div>
      )}
    </EndBlockComponent>
  )
}

const EndBlock: BlockType<EndBlockData> = {
  hasInput: true,
  hasOutput: false,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({ result: null }),
  block: (props) => <EndAndUploadBlockComponent {...props} />,
}

// Block registry
const allTestingBlocks: BlockRegistry = {
  start: StartBlock,
  import: ImportDataBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  end: EndBlock,
}

export default allTestingBlocks
