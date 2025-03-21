import { AlertCircle, Database, Image, Notebook, NotebookPen, Upload, X } from "lucide-react"
import { Block, BlockRegistry, BlockType } from "./blocks"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
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
  images: Record<string, {
    path: string,
    status: "uploading" | "success" | "error",
    progress: number,
    error?: string
  }>
}> = {
  hasInput: true,
  hasOutput: true,
  title: "Import Data",
  icon: <Database className="w-5 h-5" />,
  createNew: () => ({ images: {} }),
  block(data, id, setData, dragHandleProps) {
    const uploadFile = async (file: File) => {
      // Initialize file in the data structure with uploading status
      const updatedData = { ...data }
      updatedData.images[file.name] = {
        path: "",
        status: "uploading",
        progress: 0
      }
      setData({ ...updatedData })

      // Create form data for the file
      const formData = new FormData()
      formData.append("file", file)

      try {
        // Use XMLHttpRequest to track upload progress
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            const progressData = { ...data }
            if (progressData.images[file.name]) {
              progressData.images[file.name] = {
                ...progressData.images[file.name],
                progress
              }
              setData({ ...progressData })
            }
          }
        })

        // Create a promise to handle the XHR response
        const uploadPromise = new Promise<{ status: string; file_path: string; message: string }>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
          xhr.onerror = () => reject(new Error("Network error"))
        })

        // Open and send the request
        xhr.open("POST", "http://localhost:8888/upload")
        xhr.send(formData)

        // Wait for the upload to complete
        const response = await uploadPromise

        // Update the data with the successful upload
        const successData = { ...data }
        successData.images[file.name] = {
          path: response.file_path,
          status: "success",
          progress: 100
        }
        setData({ ...successData })
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        
        // Update the data with the error
        const errorData = { ...data }
        errorData.images[file.name] = {
          path: "",
          status: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "Unknown error"
        }
        setData({ ...errorData })
      }
    }

    const handleFileUpload = (files: FileList | null) => {
      if (!files || files.length === 0) return

      // Process each file
      Array.from(files).forEach((file) => {
        uploadFile(file)
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
              <div className="mt-2 max-h-60 overflow-y-auto text-left">
                <ul className="text-xs text-gray-600 space-y-3">
                  {Object.keys(data.images).map((filename) => {
                    const fileData = data.images[filename]
                    return (
                      <li key={filename} className="space-y-1">
                        <div className="flex items-center justify-between truncate">
                          <span className="truncate">{filename}</span>
                          <button
                            className="text-gray-500 hover:text-red-500 transition-colors ml-2 p-1"
                            onClick={() => {
                              // Create a new object without the selected file
                              const { [filename]: _, ...rest } = data.images
                              setData({ ...data, images: rest })
                            }}
                            title="Remove file"
                            disabled={fileData.status === "uploading"}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full">
                          <Progress value={fileData.progress} className="h-1" />
                        </div>
                        
                        {/* Status indicator */}
                        <div className="flex items-center text-xs">
                          {fileData.status === "uploading" && (
                            <span className="text-blue-500">
                              Uploading... {fileData.progress}%
                            </span>
                          )}
                          {fileData.status === "success" && (
                            <span className="text-green-500">
                              Uploaded successfully
                            </span>
                          )}
                          {fileData.status === "error" && (
                            <div className="flex items-center text-red-500 gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{fileData.error || "Upload failed"}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
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
