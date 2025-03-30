import { SaveFunction, splitChain } from "@/components/save_alerts"
import { filterOutKeys } from "@/lib/utils"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps, EndBlockComponent } from "./blocks"
import { GrayscaleFilterBlock, ImportDataBlock, NormalizeFilterBlock, ResizeFilterBlock, ShufflingFilterBlock } from "./preprocessing_blocks"

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
  preprocessedPath?: string
  processedForPath?: string
  processedWithOptions?: string
}

const EndAndUploadBlockComponent = (props: CreateBlockElementProps<EndBlockData>) => {
  return <EndBlockComponent stage="predicting" saveFunc={saveFunc} allBlocks={allPdBlocks} data={{}} setData={() => {}} {...filterOutKeys(props, ["data", "setData"])} buttonText={"Predict Dataset"}></EndBlockComponent>
}

const EndBlock: BlockType<EndBlockData> = {
  hasInput: true,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block: (props) => <EndAndUploadBlockComponent {...props} />,
}

// Block registry
const allPdBlocks: BlockRegistry = {
  start: StartBlock,
  import: ImportDataBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  normalize: NormalizeFilterBlock,
  shuffling: ShufflingFilterBlock,
  end: EndBlock,
}

export default allPdBlocks
