import { SaveFunction, splitChain } from "@/components/save_alerts"
import { Block, BlockRegistry, BlockType } from "./blocks"
import { EndBlockComponent } from "./common_blocks"
import { GrayscaleFilterBlock, ImportDataBlock, ResizeFilterBlock } from "./preprocessing_blocks"

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

// Block registry
const allTestingBlocks: BlockRegistry = {
  start: StartBlock,
  import: ImportDataBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  end: EndBlock,
}

export default allTestingBlocks
