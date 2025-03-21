import { Play, Flag } from "lucide-react"
import { Block, BlockType } from "./blocks"

export const StartBlock: BlockType<{}> = {
  hasInput: false,
  hasOutput: true,
  title: "Start",
  icon: <Play className="w-4 h-4 text-white" />,
  limit: 1,
  createNew: () => ({}),
  block: (_, id, dragHandleProps) => (
    <Block
      id={id}
      title="Start"
      icon={<Play className="w-4 h-4 text-white" />}
      dragHandleProps={dragHandleProps}
      className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
    >
      <div className="text-center text-sm">Start of pipeline</div>
    </Block>
  ),
};

export const EndBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: false,
  title: "End",
  icon: <Flag className="w-4 h-4 text-white" />,
  limit: 1,
  createNew: () => ({}),
  block: (_, id, dragHandleProps) => (
    <Block
      id={id}
      title="End"
      icon={<Flag className="w-4 h-4 text-white" />}
      dragHandleProps={dragHandleProps}
      className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
    >
      <div className="text-center text-sm">End of pipeline</div>
    </Block>
  ),
};
