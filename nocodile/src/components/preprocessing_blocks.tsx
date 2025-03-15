import { Database } from "lucide-react"
import { Block, BlockRegistry, BlockType } from "./blocks"
import { Button } from "./ui/button"

const ImportDataBlock: BlockType<{
  file: File | null
}> = {
  hasOutput: true,
  title: "Import Data",
  icon: <Database className="w-5 h-5" />,
  createNew: () => ({ file: null }),
  block(data, id) {
    return (
      <Block
        id={id}
        title="Import Data"
        icon={<Database className="w-5 h-5" />}
        output={{ id: `${id}-output`, type: "data" }}
      >
        {data.file ? (
          <div className="text-sm text-gray-500">
            Imported: {data.file.name} ({Math.round(data.file.size / 1024)} KB)
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
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
              onClick={() =>
                document.getElementById(`${id}-file-input`)?.click()
              }
            >
              Select File
            </Button>
          </div>
        )}
      </Block>
    )
  },
}

const TestBlockWithInput: BlockType<{}> = {
  hasInput: true,
  title: "Test block with input",
  icon: <Database className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id) {
    return (
      <Block
        id={id}
        title="Test block with input"
        icon={<Database className="w-5 h-5" />}
        input={{ id: `${id}-input`, type: "data" }}
      />
    )
  },
}

const TestBlockWithOutput: BlockType<{}> = {
  hasOutput: true,
  title: "Test block with output",
  icon: <Database className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id) {
    return (
      <Block
        id={id}
        title="Test block with output"
        icon={<Database className="w-5 h-5" />}
        output={{ id: `${id}-output`, type: "data" }}
      />
    )
  },
}

const TestBlockWithInputOutput: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Test block with input and output",
  icon: <Database className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id) {
    return (
      <Block
        id={id}
        title="Test block with input and output"
        icon={<Database className="w-5 h-5" />}
        input={{ id: `${id}-input`, type: "data" }}
        output={{ id: `${id}-output`, type: "data" }}
      />
    )
  },
}

// Block registry
const allBlocks: BlockRegistry = {
  import: ImportDataBlock,
  "test-input": TestBlockWithInput,
  "test-output": TestBlockWithOutput,
  "test-input-output": TestBlockWithInputOutput,
}

export default allBlocks
