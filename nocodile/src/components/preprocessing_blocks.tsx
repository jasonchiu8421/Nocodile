import { cn } from "@/lib/utils"
import { AlertCircle, Database, Image, Notebook, NotebookPen, Upload, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps, EndBlockComponent } from "./blocks"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { SaveFunction, splitChain } from "./save_alerts"
import { useProgressStore } from "@/store/useProgressStore"

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
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({}),
  block: (props) => <EndBlockComponent stage="preprocessing" saveFunc={saveFunc} allBlocks={allBlocks} {...props} />,
}

type ImportDataProps = {
  images: Record<
    string,
    {
      path: string
      status: "uploading" | "success" | "error"
      progress: number
      error?: string
    }
  >
}

const ImportDataBlock: BlockType<ImportDataProps> = {
  hasInput: true,
  hasOutput: true,
  limit: 1,
  title: "Import Data",
  icon: <Database className="w-5 h-5" />,
  width: 300,
  createNew: () => ({ images: {} }),
  block({ data, id, setData, dragHandleProps }) {
    const uploadFile = async (file: File) => {
      // Initialize file in the data structure with uploading status
      const updatedData = { ...data }
      updatedData.images[file.name] = {
        path: "",
        status: "uploading",
        progress: 0,
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
                progress,
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
          progress: 100,
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
          error: error instanceof Error ? error.message : "Unknown error",
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
              <div className="mt-2 text-left">
                <ul className="text-xs text-gray-600 space-y-3">
                  {Object.keys(data.images).map((filename) => {
                    const fileData = data.images[filename]
                    return (
                      <li key={filename} className="space-y-1">
                        <div className="flex items-center justify-between truncate">
                          <span className="truncate">{filename}</span>
                          <button
                            className={cn("text-gray-500 not-disabled:hover:text-red-500 transition-colors ml-2 p-1 disabled:!cursor-default")}
                            onClick={() => {
                              // Create a new object without the selected file
                              const { [filename]: _, ...rest } = data.images
                              setData({ ...data, images: rest })
                            }}
                            title="Remove file"
                            disabled={fileData.status !== "error"}
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
                          {fileData.status === "uploading" && <span className="text-blue-500">Uploading... {fileData.progress}%</span>}
                          {fileData.status === "success" && <span className="text-green-500">Uploaded successfully</span>}
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
  size: number
}> = {
  hasInput: true,
  hasOutput: true,
  limit: 1,
  title: "Resize Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({ size: 16 }),
  block({ data, id, setData, dragHandleProps }) {
    return (
      <Block id={id} title="Resize Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
        <div>
          <label htmlFor={`${id}-size`} className="text-xs text-gray-500">
            Size
          </label>
          <Input id={`${id}-size`} type="number" value={data.size} min={1} onChange={(e) => setData({ ...data, size: parseInt(e.target.value) || 1 })} className="h-7 text-sm" />
        </div>
      </Block>
    )
  },
}

const GrayscaleFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  limit: 1,
  title: "Grayscale Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block({ id, dragHandleProps }) {
    return <Block id={id} title="Grayscale Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

const NormalizeFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  limit: 1,
  title: "Normalize Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block({ id, dragHandleProps }) {
    return <Block id={id} title="Normalize Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

const ShufflingFilterBlock: BlockType<{}> = {
  hasInput: true,
  hasOutput: true,
  limit: 1,
  title: "Shuffling Filter",
  icon: <Image className="w-5 h-5" />,
  createNew: () => ({}),
  block({ id, dragHandleProps }) {
    return <Block id={id} title="Shuffling Filter" icon={<Image className="w-5 h-5" />} dragHandleProps={dragHandleProps} />
  },
}

type UploadBlockProps = {
  files: Record<
    string,
    {
      path: string
      status: "pending" | "processing" | "success" | "error"
      progress: number
      error?: string
    }
  >
}

const UploadBlockComponent = ({ id, dragHandleProps, chain, data, setData }: CreateBlockElementProps<UploadBlockProps>) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [importData, setImportData] = useState<ImportDataProps | null>(null)
  const [options, setOptions] = useState<object>({})
  const hasImportedFiles = importData && Object.keys(importData.images || {}).length > 0

  useEffect(() => {
    setImportData(null)
    const options: Record<string, any> = {}

    if (chain) {
      const uploadBlocks = chain.before.filter((block) => block.type === "upload")
      const uploadBlock = uploadBlocks.length > 0 ? uploadBlocks[uploadBlocks.length - 1] : null
      const uploadBlockIndex = uploadBlock ? chain.before.findIndex((block) => block.id === uploadBlock.id) : null
      const importBlocks = chain.before.filter((block, index) => block.type === "import" && (!uploadBlockIndex || index > uploadBlockIndex))
      const importBlock = importBlocks.length > 0 ? importBlocks[importBlocks.length - 1] : null

      if (importBlock) {
        const importBlockIndex = chain.before.findIndex((block) => block.id === importBlock.id)
        setImportData(importBlock.data)

        chain.before.slice(importBlockIndex + 1).forEach((block) => {
          if (block.type === "resize") {
            options.resize = block.data.size
          } else if (block.type === "grayscale") {
            options.grayscale = true
          } else if (block.type === "normalize") {
            options.normalize = true
          } else if (block.type === "shuffling") {
            options.shuffling = true
          }
        })
      }
    }

    setOptions(options)
  }, [chain])

  const processFile = async (data: UploadBlockProps, filename: string, filePath: string) => {
    // Update status to processing
    const updatedData = { ...data }
    updatedData.files[filename] = {
      path: filePath,
      status: "processing",
      progress: 0,
    }
    setData({ ...updatedData })

    try {
      // Use XMLHttpRequest to track processing progress
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          const progressData = { ...data }
          if (progressData.files[filename]) {
            progressData.files[filename] = {
              ...progressData.files[filename],
              progress,
            }
            setData({ ...progressData })
          }
        }
      })

      // Set up promise to handle response
      const promise = new Promise<any>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText)
                resolve(response)
              } catch (e) {
                reject(new Error("Invalid response format"))
              }
            } else {
              reject(new Error(`Processing failed with status ${xhr.status}`))
            }
          }
        }
        xhr.onerror = () => reject(new Error("Network error"))
      })

      // Prepare request data as JSON
      const requestData = JSON.stringify({
        image_path: filePath,
        options,
      })

      // Open and send the request
      xhr.open("POST", "http://localhost:8888/preprocess")
      xhr.setRequestHeader("Content-Type", "application/json")
      xhr.send(requestData)

      // Wait for the response
      const response = await promise

      // Update the data with success
      const successData = { ...data }
      successData.files[filename] = {
        path: response.processed_path || filePath,
        status: "success",
        progress: 100,
      }
      setData({ ...successData })
    } catch (error) {
      console.error(`Error processing ${filename}:`, error)

      // Update the data with the error
      const errorData = { ...data }
      errorData.files[filename] = {
        path: filePath,
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      setData({ ...errorData })
    }
  }

  const startProcessing = async () => {
    if (!importData || !importData.images) return

    setIsProcessing(true)

    // Initialize files from import data if not already present
    const filesToProcess = { ...data.files }

    // Add any new files from import that aren't already in our data
    // and reset any errored files to pending status
    Object.entries(importData.images || {}).forEach(([filename, fileData]: [string, any]) => {
      if (fileData.status === "success" && fileData.path) {
        // If file doesn't exist in our data yet, add it
        if (!filesToProcess[filename]) {
          filesToProcess[filename] = {
            path: fileData.path,
            status: "pending",
            progress: 0,
          }
        }
        // If file exists but had an error, reset it to pending
        else if (filesToProcess[filename].status === "error") {
          filesToProcess[filename] = {
            path: fileData.path,
            status: "pending",
            progress: 0,
          }
        }
      }
    })

    // Update data with the initialized files
    const newData = { files: filesToProcess }
    setData(newData)

    // Process each file
    const fileEntries = Object.entries(filesToProcess)
    for (const [filename, fileData] of fileEntries) {
      if (fileData.status === "pending") {
        await processFile(newData, filename, fileData.path)
      }
    }

    setIsProcessing(false)
  }

  return (
    <Block id={id} title="Upload" icon={<Upload className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
      <div className="space-y-4">
        {!hasImportedFiles ? (
          <div className="text-center text-sm text-gray-500">No imported files found. Please add an Import Data block before this block.</div>
        ) : (
          <>
            <div className="flex flex-col gap-2 justify-between items-center">
              <p className="text-sm font-medium">
                {Object.keys(data.files).length > 0 ? `${Object.keys(data.files).length} file${Object.keys(data.files).length !== 1 ? "s" : ""} to process` : `${Object.keys(importData.images).length} file${Object.keys(importData.images).length !== 1 ? "s" : ""} available`}
              </p>
              <Button size="sm" onClick={startProcessing} disabled={isProcessing || Object.keys(importData.images).length === 0}>
                {isProcessing ? "Processing..." : "Process Files"}
              </Button>
            </div>

            {Object.keys(data.files).length > 0 && (
              <div className="mt-2 text-left">
                <ul className="text-xs text-gray-600 space-y-3">
                  {Object.keys(data.files).map((filename) => {
                    const fileData = data.files[filename]
                    return (
                      <li key={filename} className="space-y-1">
                        <div className="flex items-center justify-between truncate">
                          <span className="truncate">{filename}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full">
                          <Progress value={fileData.progress} className="h-1" />
                        </div>

                        {/* Status indicator */}
                        <div className="flex items-center text-xs">
                          {fileData.status === "pending" && <span className="text-gray-500">Pending</span>}
                          {fileData.status === "processing" && <span className="text-blue-500">Processing... {fileData.progress}%</span>}
                          {fileData.status === "success" && <span className="text-green-500">Processed successfully</span>}
                          {fileData.status === "error" && (
                            <div className="flex items-center text-red-500 gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{fileData.error || "Processing failed"}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Block>
  )
}

const UploadBlock: BlockType<UploadBlockProps> = {
  hasInput: true,
  hasOutput: true,
  title: "Upload",
  icon: <Upload className="w-5 h-5" />,
  width: 300,
  createNew: () => ({ files: {} }),
  block: (props) => <UploadBlockComponent {...props} />,
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
