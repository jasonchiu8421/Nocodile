import { BlockRegistry } from "@/components/blocks/blocks"
import {Image} from "lucide-react"
import { BlockType } from "@/components/blocks/blocks"
import { Block } from "@/components/blocks/blocks"
import { SaveFunction, splitChain } from "@/components/save_alerts"

// Are you sure
import {EndBlockData} from "@/components/blocks/preprocessing_blocks"

// Can this be centralized?
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

// Keep them duplicated cause it needs different behavior for each step supposedly but take that time, corners are cut
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

/*
const EndBlock: BlockType<EndBlockData> = {
  hasInput: true,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block: (props) => <EndBlockComponent stage="performance" saveFunc={saveFunc} allBlocks={allPerformanceBlocks} {...props}>
    <p>Yee yee yee</p>
  </EndBlockComponent>,
}
*/
const PerfResultsBlock: BlockType<EndBlockData> = {
  hasInput: true,
  title: "Test Results",
  icon: <div className="w-4 h-4 rounded-full bg-red-500"/>,
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block({ id, dragHandleProps }) {
    return <Block id={id} title="Test Results" icon={<div className="w-4 h-4 rounded-full bg-green-500" />} color="bg-green-50" dragHandleProps={dragHandleProps} />
},
}
const DataBlock: BlockType<{}> = {
    hasInput: true,
    hasOutput: true,
    limit: 1,
    title: "Data Block",
    icon: <Image className="w-5 h-5" />,
    createNew: () => ({}),
    block({ id, dragHandleProps }) {
      return <Block id={id} title="Data Block (WHERE PATH)" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
    },
  }

const allPerformanceBlocks: BlockRegistry = {
  start: StartBlock,
  end: PerfResultsBlock,
  dataBlock: DataBlock
}

export default allPerformanceBlocks;
