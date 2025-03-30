import { BlockRegistry } from "@/components/blocks/blocks"
import {Image} from "lucide-react"
import { BlockType, CreateBlockElementProps } from "@/components/blocks/blocks"
import { Block } from "@/components/blocks/blocks"
import { SaveFunction, splitChain } from "@/components/save_alerts"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { useState } from "react"

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
// The end one here is special
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
const PerfResultsComponent = ({ id, dragHandleProps }: Omit<CreateBlockElementProps<EndBlockData>, "dragging">) => {
  const [resultsVisible, setResultsVisible] = useState(false);
  const [results, setResults] = useState<EndBlockData | null>(null); // set to output path?
  
  return (
    <Block id={id} title="Test Results" icon={<div className="w-4 h-4 rounded-full bg-red-500" />} color="bg-red-50" dragHandleProps={dragHandleProps}>
      <section className="flex flex-col gap-4 p-2">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full"
          onClick={() => {
            console.log("Testing model");
            setResultsVisible(true);
          }}
        >
          Test Model
        </Button>
      </section>
      <section className={`mt-2 p-3 rounded-md border ${resultsVisible ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Results</h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!resultsVisible}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <hr className="mb-3" />
        <div className="text-xs space-y-1">
          {resultsVisible ? (
            <>
              <p className="flex justify-between">{results?.preprocessedPath}</p>
            </>
          ) : (
            <p className="text-center text-gray-500">Run test to see results</p>
          )}
        </div>
      </section>
    </Block>
  )
}

const PerfResultsBlock: BlockType<EndBlockData> = {
  hasInput: true,
  title: "Test Results",
  icon: <div className="w-4 h-4 rounded-full bg-red-500"/>,
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block: (props)=> <PerfResultsComponent {...props} />,
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
