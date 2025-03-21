import { Database, Image, Notebook, NotebookPen, Upload, X } from "lucide-react"
import { Block, BlockRegistry, BlockType } from "./blocks"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Separator } from "./ui/separator"

const StartBlock: BlockType<{}> = {
  hasOutput: true,
  title: "Start",
  icon: <Notebook className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({}),
  block(_, id, setData, dragHandleProps) {
    return <Block id={id} title="Start" icon={<Notebook className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

const EndBlock: BlockType<{}> = {
  hasInput: true,
  title: "End",
  icon: <NotebookPen className="w-5 h-5" />,
  limit: 1,
  createNew: () => ({}),
  block(_, id, setData, dragHandleProps) {
    return <Block id={id} title="End" icon={<NotebookPen className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

const ImportDataBlock: BlockType<{
  images: Record<string, string> // Dictionary of file paths to base64 data
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Import Data",
  icon: <Database className="w-5 h-5" />,
  createNew: () => ({ images: {} }),
  block(data, id, setData, dragHandleProps) {
    const handleFileUpload = (files: FileList | null) => {
      if (!files || files.length === 0) return

      const newData = {...data}
      const fileArray = Array.from(files)
      let loadedCount = 0

      // Process each file
      fileArray.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64Data = e.target?.result as string
          newData.images[file.name] = base64Data
          console.log(`Added image: ${file.name}`)
          
          // Increment the counter for loaded files
          loadedCount++
          
          // Only call setData after all files have been processed
          if (loadedCount === fileArray.length) {
            console.log("All files processed, updating data")
            setData({...newData})
          }
        }
        reader.readAsDataURL(file)
      })
    }

    // Drag and drop event handlers
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files)
      }
    }

    return (
      <Block id={id} title="Import Data" icon={<Database className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center space-y-3" onDragOver={handleDragOver} onDrop={handleDrop}>
          <p className="text-sm text-gray-500">Drag and drop images here or click to browse</p>
          <input type="file" className="hidden" id={`${id}-file-input`} multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} />
          <Button variant="ghost" onClick={() => document.getElementById(`${id}-file-input`)?.click()}>
            Select Images
          </Button>

          {/* Display uploaded images count */}
          {Object.keys(data.images).length > 0 && (
            <>
              <Separator />
              <p className="text-sm font-medium">
                {Object.keys(data.images).length} image{Object.keys(data.images).length !== 1 ? "s" : ""} uploaded
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto text-left">
                <ul className="text-xs text-gray-600 space-y-1">
                  {Object.keys(data.images).map((filename) => (
                    <li key={filename} className="flex items-center justify-between truncate">
                      <span className="truncate">{filename}</span>
                      <button
                        className="text-gray-500 hover:text-red-500 transition-colors ml-2 p-1"
                        onClick={() => {
                          // Create a new object without the selected file
                          const { [filename]: _, ...rest } = data.images
                          setData({ ...data, images: rest })
                        }}
                        title="Remove file"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
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
  block(data, id, setData, dragHandleProps) {
    return (
      <Block id={id} title="Resize Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${id}-width`} className="text-xs text-gray-500">
              Width
            </label>
            <Input id={`${id}-width`} type="number" value={data.width} min={1} onChange={(e) => (data.width = parseInt(e.target.value) || 1)} className="h-7 text-sm" />
          </div>
          <div>
            <label htmlFor={`${id}-height`} className="text-xs text-gray-500">
              Height
            </label>
            <Input id={`${id}-height`} type="number" value={data.height} min={1} onChange={(e) => (data.height = parseInt(e.target.value) || 1)} className="h-7 text-sm" />
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
  block(_, id, setData, dragHandleProps) {
    return <Block id={id} title="Grayscale Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

const NormalizeFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Normalize Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id, setData, dragHandleProps) {
    return <Block id={id} title="Normalize Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

const ShufflingFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Shuffling Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id, setData, dragHandleProps) {
    return <Block id={id} title="Shuffling Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

const UploadBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  title: "Upload",
  icon: <Upload className="w-5 h-5" />,
  createNew: () => ({}),
  block(_, id, setData, dragHandleProps) {
    return <Block id={id} title="Upload" icon={<Upload className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
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
