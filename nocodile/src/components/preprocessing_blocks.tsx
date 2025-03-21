import { Check, Database, Image, Play, Flag } from "lucide-react"
import { Block, BlockRegistry, BlockType } from "./blocks"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

const ImportDataBlock: BlockType<{
  images: Array<{ name: string; label: string }>;
}> = {
  hasOutput: true,
  hasInput: true,
  title: "Import Data",
  icon: <Database className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({ images: [] }),
  block: (data, id, dragHandleProps) => (
    <Block
      id={id}
      title="Import Data"
      icon={<Database className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center space-y-3">
        <p className="text-sm text-gray-500">
          Drag and drop files here or click to browse
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          id={`${id}-file-input`}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            data.images = files.map(file => ({
              name: file.name,
              label: ""  // Default empty label
            }));
          }}
        />
        <Button
          variant="ghost"
          onClick={() => document.getElementById(`${id}-file-input`)?.click()}
        >
          Select Files
        </Button>
        {data.images.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">{data.images.length} files selected</p>
          </div>
        )}
      </div>
    </Block>
  ),
};

const ResizeFilterBlock: BlockType<{
  width: number;
  height: number;
  enabled: boolean;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Resize Filter",
  icon: <Image className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({ width: 256, height: 256, enabled: true }),
  block: (data, id, dragHandleProps) => (
    <Block
      id={id}
      title="Resize Filter"
      icon={<Image className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${id}-width`} className="text-xs text-gray-500">
              Width
            </label>
            <Input
              id={`${id}-width`}
              type="number"
              value={data.width}
              min={1}
              onChange={(e) => data.width = parseInt(e.target.value) || 1}
              className="h-7 text-sm"
            />
          </div>
          <div>
            <label htmlFor={`${id}-height`} className="text-xs text-gray-500">
              Height
            </label>
            <Input
              id={`${id}-height`}
              type="number"
              value={data.height}
              min={1}
              onChange={(e) => data.height = parseInt(e.target.value) || 1}
              className="h-7 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`${id}-enabled`}
            checked={data.enabled}
            onChange={(e) => data.enabled = e.target.checked}
          />
          <label htmlFor={`${id}-enabled`} className="text-xs text-gray-500">
            Enabled
          </label>
        </div>
      </div>
    </Block>
  ),
};

const GrayscaleFilterBlock: BlockType<{
  enabled: boolean;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Grayscale Filter",
  icon: <Image className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({ enabled: true }),
  block: (data, id, dragHandleProps) => (
    <Block
      id={id}
      title="Grayscale Filter"
      icon={<Image className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`${id}-enabled`}
          checked={data.enabled}
          onChange={(e) => data.enabled = e.target.checked}
        />
        <label htmlFor={`${id}-enabled`} className="text-xs text-gray-500">
          Enabled
        </label>
      </div>
    </Block>
  ),
};

const NormalizeFilterBlock: BlockType<{
  enabled: boolean;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Normalize Filter",
  icon: <Image className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({ enabled: true }),
  block: (data, id, dragHandleProps) => (
    <Block
      id={id}
      title="Normalize Filter"
      icon={<Image className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`${id}-enabled`}
          checked={data.enabled}
          onChange={(e) => data.enabled = e.target.checked}
        />
        <label htmlFor={`${id}-enabled`} className="text-xs text-gray-500">
          Enabled
        </label>
      </div>
    </Block>
  ),
};

const ShufflingFilterBlock: BlockType<{
  enabled: boolean;
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Shuffling Filter",
  icon: <Image className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({ enabled: true }),
  block: (data, id, dragHandleProps) => (
    <Block
      id={id}
      title="Shuffling Filter"
      icon={<Image className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`${id}-enabled`}
          checked={data.enabled}
          onChange={(e) => data.enabled = e.target.checked}
        />
        <label htmlFor={`${id}-enabled`} className="text-xs text-gray-500">
          Enabled
        </label>
      </div>
    </Block>
  ),
};

const SubmitBlock: BlockType<{}> = {
  hasInput: true,
  title: "Submit",
  icon: <Check className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({}),
  block: (_, id, dragHandleProps) => (
    <Block
      id={id}
      title="Submit"
      icon={<Check className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    />
  ),
}

const StartBlock: BlockType<{}> = {
  hasInput: false,
  hasOutput: true,
  title: "Start",
  icon: <Play className="w-5 h-5 text-white" />,
  limit: 1,
  createNew: () => ({}),
  block: (_, id, dragHandleProps) => (
    <Block
      id={id}
      title="Start"
      icon={<Play className="w-5 h-5 text-white" />}
      dragHandleProps={dragHandleProps}
      className="bg-green-500 hover:bg-green-600 text-white"
    >
      <div className="p-2 text-center">
        <p className="text-sm">Start of pipeline</p>
      </div>
    </Block>
  ),
};

const EndBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: false,
  title: "End",
  icon: <Flag className="w-5 h-5 text-white" />,
  limit: 1,
  createNew: () => ({}),
  block: (_, id, dragHandleProps) => (
    <Block
      id={id}
      title="End"
      icon={<Flag className="w-5 h-5 text-white" />}
      dragHandleProps={dragHandleProps}
      className="bg-red-500 hover:bg-red-600 text-white"
    >
      <div className="p-2 text-center">
        <p className="text-sm">End of pipeline</p>
      </div>
    </Block>
  ),
};

// Block registry
const preprocessingBlocks: BlockRegistry = {
  //start: StartBlock,
  //end: EndBlock,
  import: ImportDataBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  normalize: NormalizeFilterBlock,
  shuffling: ShufflingFilterBlock,
  //submit: SubmitBlock,
}

export default preprocessingBlocks;
