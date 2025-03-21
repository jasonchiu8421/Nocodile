import { Database, Image, Notebook, NotebookPen, Upload } from "lucide-react"
import { Block, BlockRegistry, BlockType } from "./blocks"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

const StartBlock: BlockType<{}> = {
  hasOutput: true,
  title: "Start",
  icon: <Notebook className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({}),
  block(_, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="Start"
        icon={<Notebook className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      />
    )
  },
}

const EndBlock: BlockType<{}> = {
  hasInput: true,
  title: "End",
  icon: <NotebookPen className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({}),
  block(_, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="End"
        icon={<NotebookPen className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      />
    )
  },
}

const ImportDataBlock: BlockType<{
  file: File | null
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Import Data",
  icon: <Database className="w-5 h-5" />,
  createNew: () => ({ file: null }),
  block(_, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="Import Data"
        icon={<Database className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      >
        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center space-y-3">
          <p className="text-sm text-gray-500">
            Drag and drop a file here or click to browse
          </p>
          <input
            type="file"
            className="hidden"
            id={`${id}-file-input`}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                // Handle file selection logic here
                console.log("File selected:", file)
              }
            }}
          />
          <Button
            variant="ghost"
            onClick={() => document.getElementById(`${id}-file-input`)?.click()}
          >
            Select File
          </Button>
        </div>
      </Block>
    )
  },
}

const ResizeFilterBlock: BlockType<{
  width: number
  height: number
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Resize Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({ width: 256, height: 256 }),
  block(data, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="Resize Filter"
        icon={<Image className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      >
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
              onChange={(e) => (data.width = parseInt(e.target.value) || 1)}
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
              onChange={(e) => (data.height = parseInt(e.target.value) || 1)}
              className="h-7 text-sm"
            />
          </div>
        </div>
      </Block>
    )
  },
}

const GrayscaleFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Grayscale Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="Grayscale Filter"
        icon={<Image className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      />
    )
  },
}

const NormalizeFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Normalize Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="Normalize Filter"
        icon={<Image className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      />
    )
  },
}

const ShufflingFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Shuffling Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="Shuffling Filter"
        icon={<Image className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      />
    )
  },
}

const UploadBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Upload",
  icon: <Upload className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id, dragHandleProps) {
    return (
      <Block
        id={id}
        title="Upload"
        icon={<Upload className="w-5 h-5" />}
        dragHandleProps={dragHandleProps}
      />
    )
  },
}

// Block registry
const allBlocks: BlockRegistry = {
  start: StartBlock,
  import: ImportDataBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  normalize: NormalizeFilterBlock,
  shuffling: ShufflingFilterBlock,
  upload: UploadBlock,
  end: EndBlock,
}

export default allBlocks
