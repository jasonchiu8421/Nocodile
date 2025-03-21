import { cn } from "@/lib/utils"
import { AlertCircle, Database, Image, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps, EndBlockComponent } from "./blocks"
import { SaveFunction, splitChain } from "./save_alerts"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"

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

const EndAndUploadBlockComponent = (props: CreateBlockElementProps<UploadBlockProps>) => {
  const { id, data, setData, chain, blocks, dragHandleProps } = props
  // We use setIsProcessing but not isProcessing directly in JSX
  const [isProcessing, setIsProcessing] = useState(false)
  const [importData, setImportData] = useState<ImportDataProps | null>(null)
  const [options, setOptions] = useState<object>({})

  // Helper function to count total images across all datasets
  const getTotalImagesCount = (importData: ImportDataProps | null): number => {
    if (!importData || !importData.datasets || importData.datasets.length === 0) return 0

    return importData.datasets.reduce((total, dataset) => {
      return total + Object.keys(dataset.images).length
    }, 0)
  }

  useEffect(() => {
    setImportData(null)
    const options: Record<string, any> = {}

    if (chain) {
      const importBlocks = chain.before.filter((block) => block.type === "import")
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
      
      // Show success toast for this file
      toast.success(`Processed ${filename} successfully`, {
        duration: 2000,
      })
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
      
      // Show error toast for this file
      toast.error(`Error processing ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`, {
        duration: 4000,
      })
    }
  }

  const startProcessing = async () => {
    if (!importData || !importData.datasets || importData.datasets.length === 0) return

    setIsProcessing(true)
    
    // Show toast notification for processing start
    const totalImages = getTotalImagesCount(importData)
    toast.info(`Processing ${totalImages} image${totalImages !== 1 ? 's' : ''}...`, {
      duration: 3000,
    })

    // Initialize files from import data if not already present
    const filesToProcess = { ...data.files }

    // Add any new files from import that aren't already in our data
    // and reset any errored files to pending status
    importData.datasets.forEach((dataset) => {
      Object.entries(dataset.images).forEach(([filename, fileData]: [string, any]) => {
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
    })

    // Update data with the initialized files
    const newData = { files: filesToProcess }
    setData(newData)

    // Process each file
    const fileEntries = Object.entries(filesToProcess)
    let successCount = 0
    let errorCount = 0
    
    for (const [filename, fileData] of fileEntries) {
      if (fileData.status === "pending") {
        await processFile(newData, filename, fileData.path)
        
        // Count successes and errors
        if (newData.files[filename].status === "success") {
          successCount++
        } else if (newData.files[filename].status === "error") {
          errorCount++
        }
      }
    }

    setIsProcessing(false)
    
    // Show summary toast when all processing is complete
    const totalProcessed = successCount + errorCount
    if (totalProcessed > 0) {
      if (errorCount === 0) {
        toast.success(`All ${totalProcessed} images processed successfully!`, {
          duration: 5000,
        })
      } else if (successCount === 0) {
        toast.error(`Failed to process all ${totalProcessed} images.`, {
          duration: 5000,
        })
      } else {
        toast(`Processing complete: ${successCount} successful, ${errorCount} failed`, {
          duration: 5000,
        })
      }
    }
  }

  return <EndBlockComponent stage="preprocessing" saveFunc={saveFunc} allBlocks={allBlocks} step={startProcessing} id={id} blocks={blocks} data={{}} chain={chain} setData={() => {}} dragHandleProps={dragHandleProps} />
}

const EndBlock: BlockType<UploadBlockProps> = {
  hasInput: true,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  createNew: () => ({ files: {} }),
  block: (props) => <EndAndUploadBlockComponent {...props} />,
}

type Dataset = {
  id: string
  label: string
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

type ImportDataProps = {
  datasets: Dataset[]
}

function ImportDataBlockComponent({ data, id, setData, dragHandleProps }: CreateBlockElementProps<ImportDataProps>) {
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null)
  const [newDatasetName, setNewDatasetName] = useState("")

  // Generate a unique ID for new datasets
  const generateId = () => `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Get the active dataset
  const activeDataset = activeDatasetId ? data.datasets.find((d) => d.id === activeDatasetId) : null

  // Create a new dataset
  const createNewDataset = () => {
    if (!newDatasetName.trim()) return

    const newDataset: Dataset = {
      id: generateId(),
      label: newDatasetName.trim(),
      images: {},
    }

    setData({
      ...data,
      datasets: [...data.datasets, newDataset],
    })

    setActiveDatasetId(newDataset.id)
    setNewDatasetName("")
  }

  // Delete a dataset
  const deleteDataset = (datasetId: string) => {
    setData({
      ...data,
      datasets: data.datasets.filter((d) => d.id !== datasetId),
    })

    if (activeDatasetId === datasetId) {
      setActiveDatasetId(data.datasets.length > 1 ? data.datasets[0].id : null)
    }
  }

  // Upload file to the active dataset
  const uploadFile = async (file: File) => {
    if (!activeDataset) return

    // Initialize file in the data structure with uploading status
    const updatedDatasets = [...data.datasets]
    const datasetIndex = updatedDatasets.findIndex((d) => d.id === activeDatasetId)

    if (datasetIndex === -1) return

    updatedDatasets[datasetIndex] = {
      ...updatedDatasets[datasetIndex],
      images: {
        ...updatedDatasets[datasetIndex].images,
        [file.name]: {
          path: "",
          status: "uploading",
          progress: 0,
        },
      },
    }

    setData({ ...data, datasets: updatedDatasets })

    // Create form data for the file
    const formData = new FormData()
    formData.append("file", file)

    try {
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          const progressDatasets = [...data.datasets]
          const dsIndex = progressDatasets.findIndex((d) => d.id === activeDatasetId)

          if (dsIndex !== -1 && progressDatasets[dsIndex].images[file.name]) {
            progressDatasets[dsIndex] = {
              ...progressDatasets[dsIndex],
              images: {
                ...progressDatasets[dsIndex].images,
                [file.name]: {
                  ...progressDatasets[dsIndex].images[file.name],
                  progress,
                },
              },
            }
            setData({ ...data, datasets: progressDatasets })
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
      const successDatasets = [...data.datasets]
      const dsIndex = successDatasets.findIndex((d) => d.id === activeDatasetId)

      if (dsIndex !== -1) {
        successDatasets[dsIndex] = {
          ...successDatasets[dsIndex],
          images: {
            ...successDatasets[dsIndex].images,
            [file.name]: {
              path: response.file_path,
              status: "success",
              progress: 100,
            },
          },
        }
        setData({ ...data, datasets: successDatasets })
      }
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error)

      // Update the data with the error
      const errorDatasets = [...data.datasets]
      const dsIndex = errorDatasets.findIndex((d) => d.id === activeDatasetId)

      if (dsIndex !== -1) {
        errorDatasets[dsIndex] = {
          ...errorDatasets[dsIndex],
          images: {
            ...errorDatasets[dsIndex].images,
            [file.name]: {
              path: "",
              status: "error",
              progress: 0,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          },
        }
        setData({ ...data, datasets: errorDatasets })
      }
    }
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0 || !activeDataset) return

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

    if (activeDataset && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  // Remove file from dataset
  const removeFile = (datasetId: string, filename: string) => {
    const updatedDatasets = [...data.datasets]
    const datasetIndex = updatedDatasets.findIndex((d) => d.id === datasetId)

    if (datasetIndex === -1) return

    const { [filename]: _, ...restImages } = updatedDatasets[datasetIndex].images

    updatedDatasets[datasetIndex] = {
      ...updatedDatasets[datasetIndex],
      images: restImages,
    }

    setData({ ...data, datasets: updatedDatasets })
  }

  // Set active dataset when component mounts if there are datasets
  useEffect(() => {
    if (data.datasets.length > 0 && !activeDatasetId) {
      setActiveDatasetId(data.datasets[0].id)
    }
  }, [data.datasets, activeDatasetId])

  return (
    <Block id={id} title="Import Data" icon={<Database className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
      <div className="space-y-4">
        {/* Dataset selector */}
        {data.datasets.length > 0 && (
          <div className="flex flex-col space-y-2">
            <label className="text-xs text-gray-500">Select Dataset</label>
            <div className="flex flex-wrap gap-2">
              {data.datasets.map((dataset) => (
                <Button key={dataset.id} variant={activeDatasetId === dataset.id ? "default" : "outline"} size="sm" className="text-xs flex items-center gap-1 h-7 px-2" onClick={() => setActiveDatasetId(dataset.id)}>
                  <span className="truncate max-w-[100px]">{dataset.label}</span>
                  <button
                    className="ml-1 text-gray-500 hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteDataset(dataset.id)
                    }}
                    title="Delete dataset"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Create new dataset */}
        <div className="border-t pt-3 space-y-2">
          <label className="text-xs text-gray-500">Create New Dataset</label>
          <div className="flex gap-2">
            <Input placeholder="Dataset name" value={newDatasetName} onChange={(e) => setNewDatasetName(e.target.value)} className="h-7 text-sm flex-1" />
            <Button variant="outline" size="sm" className="h-7" onClick={createNewDataset} disabled={!newDatasetName.trim()}>
              Add
            </Button>
          </div>
        </div>

        {/* Image upload area - only show if there's an active dataset */}
        {activeDataset && (
          <div className="border-t pt-3">
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center space-y-3" onDragOver={handleDragOver} onDrop={handleDrop}>
              <p className="text-sm text-gray-500">Drag and drop images here or click to browse</p>
              <input type="file" className="hidden" id={`${id}-file-input`} multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} />
              <Button variant="ghost" onClick={() => document.getElementById(`${id}-file-input`)?.click()}>
                Select Images
              </Button>

              {/* Display uploaded images count */}
              {Object.keys(activeDataset.images).length > 0 && (
                <>
                  <Separator />
                  <p className="text-sm font-medium">
                    {Object.keys(activeDataset.images).length} image{Object.keys(activeDataset.images).length !== 1 ? "s" : ""} uploaded
                  </p>
                  <div className="mt-2 text-left">
                    <ul className="text-xs text-gray-600 space-y-3">
                      {Object.keys(activeDataset.images).map((filename) => {
                        const fileData = activeDataset.images[filename]
                        return (
                          <li key={filename} className="space-y-1">
                            <div className="flex items-center justify-between truncate">
                              <span className="truncate">{filename}</span>
                              <button
                                className={cn("text-gray-500 not-disabled:hover:text-red-500 transition-colors ml-2 p-1 disabled:!cursor-default")}
                                onClick={() => removeFile(activeDataset.id, filename)}
                                title="Remove image"
                                disabled={fileData.status !== "error" && fileData.status !== "success"}
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
          </div>
        )}

        {/* Show message if no datasets */}
        {data.datasets.length === 0 && <div className="text-center text-sm text-gray-500 mt-4">Create a dataset to get started</div>}
      </div>
    </Block>
  )
}

const ImportDataBlock: BlockType<ImportDataProps> = {
  hasInput: true,
  hasOutput: true,
  limit: 1,
  title: "Import Data",
  icon: <Database className="w-5 h-5" />,
  width: 350,
  createNew: () => ({ datasets: [] }),
  block: (props) => <ImportDataBlockComponent {...props} />,
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

// Block registry
const allBlocks: BlockRegistry = {
  start: StartBlock,
  import: ImportDataBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  normalize: NormalizeFilterBlock,
  shuffling: ShufflingFilterBlock,
  end: EndBlock,
}

export default allBlocks
