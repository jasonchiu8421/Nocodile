import { SaveFunction, splitChain } from "@/components/save_alerts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { deleteFile, preprocessDataset, uploadDataset } from "@/lib/server_hooks"
import { useBlocksStore } from "@/store/useBlocksStore"
import { Database, FileSpreadsheet, Image, Plus, Trash, Upload, X } from "lucide-react"
import Papa from "papaparse"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Block, BlockRegistry, BlockType, CreateBlockElementProps } from "./blocks"
import { EndBlockComponent } from "./common_blocks"

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
// Keep them duplicated cause it needs different Uhh behavior for each step supposedly but take that time, corners are cut
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

export type EndBlockData = {
  preprocessedPath?: string
  processedForPath?: string
  processedWithOptions?: string
}

const EndAndUploadBlockComponent = (props: CreateBlockElementProps<EndBlockData>) => {
  const { id, chain, blocks, dragHandleProps, data, setData, dragging } = props
  const [isProcessing, setIsProcessing] = useState(false)
  const [importData, setImportData] = useState<ImportDataProps | null>(null)
  const [options, setOptions] = useState<Record<string, any>>({})

  const { setPreprocessingData } = useBlocksStore()

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

  const startProcessing = async () => {
    if (isProcessing) return
    if (!importData) {
      toast.error("Please attach an import data block to this block!")
      return
    } else if (!importData.datasetFile) {
      toast.error("Please first finish importing the dataset!")
      return
    }

    setIsProcessing(true)
    setData({ ...data, preprocessedPath: undefined, processedForPath: undefined, processedWithOptions: undefined })
    setPreprocessingData((prev) => ({ ...prev, preprocessedPath: null }))

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    await sleep(500)

    preprocessDataset({
      dataset_path: importData.datasetFile,
      options: {
        ...(options["resize"] ? { resize: [options["resize"] as number, options["resize"] as number] } : {}),
        ...(options["grayscale"] ? { grayscale: true } : {}),
        ...(options["normalize"] ? { normalize: true } : {}),
        ...(options["shuffling"] ? { shuffle: true } : {}),
      },
    }).then((response) => {
      if (response.success) {
        setData({
          ...data,
          preprocessedPath: response.data.output,
          processedForPath: importData.datasetFile ?? undefined,
          processedWithOptions: JSON.stringify(options),
        })
        setPreprocessingData((prev) => ({ ...prev, preprocessedPath: response.data.output }))
        setIsProcessing(false)
        toast.success("Dataset preprocessed successfully")
      } else {
        toast.error("Failed to preprocess dataset", {
          description: response.error,
        })
        setIsProcessing(false)
      }
    })
  }

  // Function to handle deletion of preprocessed file
  const handleDeletePreprocessedFile = async (pathToDelete: string) => {
    if (dragging) return

    try {
      const response = await deleteFile(pathToDelete)
      if (response.success) {
        toast.success("Preprocessed file deleted successfully")
      } else {
        toast.error(response.error || "Failed to delete file")
      }
    } catch (error) {
      // If deletion fails, we still want to clear the local state
      console.error("Failed to delete preprocessed file:", error)
    }
  }

  useEffect(() => {
    const currentDatasetPath = importData?.datasetFile || null
    const optionsString = JSON.stringify(options)

    if (data.preprocessedPath && data.processedForPath && data.processedWithOptions && (currentDatasetPath !== data.processedForPath || optionsString !== data.processedWithOptions)) {
      const pathToDelete = data.preprocessedPath

      setData({ ...data, preprocessedPath: undefined, processedForPath: undefined, processedWithOptions: undefined })
      setPreprocessingData((prev) => ({ ...prev, preprocessedPath: null }))

      handleDeletePreprocessedFile(pathToDelete)
    }
  }, [importData, options, data, setData, dragging])

  return (
    <EndBlockComponent stage="preprocessing" saveFunc={saveFunc} allBlocks={allPpBlocks} step={startProcessing} id={id} blocks={blocks} data={data} chain={chain} setData={setData} dragHandleProps={dragHandleProps} buttonText={"Preprocess Dataset"}>
      <div className={`overflow-hidden transition-all duration-400 ${data.preprocessedPath && !dragging ? "max-h-20 mt-2" : "max-h-0 -mt-4"}`}>
        <div className="p-2 bg-green-50 rounded border border-green-200">
          <p className="text-sm font-medium">
            Preprocessed path: <span className="font-normal">{data.preprocessedPath}</span>
          </p>
        </div>
      </div>
    </EndBlockComponent>
  )
}

const EndBlock: BlockType<EndBlockData> = {
  hasInput: true,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  width: 300,
  immortal: true,
  createNew: () => ({}),
  block: (props) => <EndAndUploadBlockComponent {...props} />,
}

type ImportDataProps = {
  datasetFile: string | null
}

interface DataRow {
  label: string
  image: string // base64 encoded image
}

function ImportDataBlockComponent({ data, id, setData, dragHandleProps, shouldSetPreprocessingData }: CreateBlockElementProps<ImportDataProps> & {
  shouldSetPreprocessingData: boolean
}) {
  // File upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fakeProgress, setFakeProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Create in browser states
  const [createMode, setCreateMode] = useState(false)
  const [browserDataset, setBrowserDataset] = useState<DataRow[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [currentPreviews, setCurrentPreviews] = useState<string[]>([])

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const { setPreprocessingData } = useBlocksStore()

  // Generate a random UUID
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // Effect for fake progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isUploading && fakeProgress < 95) {
      interval = setInterval(() => {
        setFakeProgress((prev) => {
          // Slow down as we approach higher percentages
          const increment = prev < 40 ? 1.5 : prev < 60 ? 1 : prev < 80 ? 3 / 5.0 : 1 / 5.0
          return Math.min(prev + increment, 97)
        })
      }, 20)
    }

    return () => {
      clearInterval(interval)
      if (!isUploading) {
        setFakeProgress(0)
      }
    }
  }, [isUploading, fakeProgress])

  // Handler for uploading a CSV file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.name.endsWith(".csv")) {
      setError(`Only CSV files are allowed (${file.name})`)
      toast.error(`Only CSV files are allowed (${file.name})`)
      return
    }

    // Generate random UUID filename, change to text/csv
    const uuid = generateUUID()
    const fileExtension = file.name.split(".").pop() || "csv"
    const renamedFile = new File([file], `${uuid}.${fileExtension}`, { type: "text/csv" })

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const response = await uploadDataset(renamedFile)

      if (response.success) {
        // Success case, response is the filename
        setData({ ...data, datasetFile: response.data })
        if (shouldSetPreprocessingData) {
          setPreprocessingData((prev) => ({ ...prev, uploadPath: response.data }))
        }
        toast.success("Dataset uploaded successfully")
      } else {
        // Error case
        setError(response.error || "Failed to upload file")
        toast.error(response.error || "Failed to upload file")
      }
    } catch (err) {
      const errorMessage = "An error occurred during upload"
      setError(errorMessage)
      toast.error(errorMessage, {
        description: (err as Error).message,
      })
      console.error(err)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handler for deleting the current dataset file
  const handleDeleteFile = async () => {
    if (!data.datasetFile) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await deleteFile(data.datasetFile)
      if (response.success) {
        setData({ ...data, datasetFile: null })
        if (shouldSetPreprocessingData) {
          setPreprocessingData((prev) => ({ ...prev, uploadPath: null }))
        }
        toast.success("Dataset deleted successfully")
      } else {
        setError(response.error || "Failed to delete file")
        toast.error(response.error || "Failed to delete file")
      }
    } catch (err) {
      const errorMessage = "An error occurred while deleting the file"
      setError(errorMessage)
      toast.error(errorMessage)
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handler for handling image uploads for in-browser dataset creation
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    let filesUploaded = []
    let completed = 0

    for (const file of filesArray) {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          let image = reader.result as string
          if (image.startsWith("data:image/png;base64,")) {
            image = image.replace("data:image/png;base64,", "")
          }
          filesUploaded.push(image)
          completed++
          if (completed === filesArray.length) {
            setCurrentPreviews(filesUploaded)
            toast.success("Images uploaded successfully")
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Trigger image input click
  const triggerImageUpload = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click()
    }
  }

  // Add a new row to the browser dataset
  const addDataRow = () => {
    if (!newLabel || !currentPreviews.length) return

    setBrowserDataset([
      ...browserDataset,
      ...currentPreviews.map((preview) => ({
        label: newLabel,
        image: preview,
      })),
    ])

    // Reset form
    setNewLabel("")
    setCurrentPreviews([])

    // Reset the image input
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }

    toast.success(`Added new images with label: ${newLabel}`)
  }

  // Generate CSV from browser dataset and upload
  const handleCreateDatasetSubmit = async () => {
    if (browserDataset.length === 0) {
      const errorMessage = "Please add at least one data row"
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }

    // Generate CSV content with proper escaping using PapaParse
    const csvContent = Papa.unparse({
      fields: ["label", "image"],
      data: browserDataset.map(row => [row.label, row.image])
    })
    const csvBlob = new Blob([csvContent], { type: "text/csv" })

    // Use UUID for filename
    const uuid = generateUUID()
    const csvFile = new File([csvBlob], `${uuid}.csv`, { type: "text/csv" })

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const response = await uploadDataset(csvFile)

      if (response.success) {
        // Success case
        setData({ ...data, datasetFile: response.data })
        if (shouldSetPreprocessingData) {
          setPreprocessingData((prev) => ({ ...prev, uploadPath: response.data }))
        }
        // Reset create mode and dataset
        setCreateMode(false)
        setBrowserDataset([])
        toast.success(`Created and uploaded dataset: ${response.data.split("/").pop()}`)
      } else {
        // Error case
        setError(response.error || "Failed to upload generated dataset")
        toast.error(response.error || "Failed to upload generated dataset")
      }
    } catch (err) {
      const errorMessage = "An error occurred during upload"
      setError(errorMessage)
      toast.error(errorMessage)
      console.error(err)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Toggle create mode
  const toggleCreateMode = () => {
    setCreateMode(!createMode)
    setError(null)
    if (!createMode) {
      // Reset browser dataset when entering create mode
      setBrowserDataset([])
      setNewLabel("")
      setCurrentPreviews([])
    }
  }

  // Remove a row from browser dataset
  const removeDataRow = (index: number) => {
    const newDataset = [...browserDataset]
    newDataset.splice(index, 1)
    setBrowserDataset(newDataset)
    toast.success("Removed image from dataset")
  }

  // Reset browser dataset creation
  const resetBrowserDataset = () => {
    setBrowserDataset([])
    setNewLabel("")
    setCurrentPreviews([])
    toast.success("Reset dataset creation")
  }

  // Render component
  return (
    <Block id={id} title="Import Data" icon={<FileSpreadsheet className="w-4 h-4" />} dragHandleProps={dragHandleProps}>
      <div className="space-y-4">
        {error && <div className="p-3 mb-3 text-sm font-medium text-red-900 bg-red-100 rounded">{error}</div>}

        {/* Current Dataset Display */}
        {data.datasetFile ? (
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">
                  Dataset path: <span className="font-normal">{data.datasetFile}</span>
                </span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteFile} disabled={isDeleting} className="h-7 px-2">
                {isDeleting ? "Deleting..." : "Delete"}
                {!isDeleting && <Trash className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="datasetFile">Creation Mode</Label>

              {/* Mode Selector */}
              <div className="flex h-7 items-center space-x-2">
                <Button variant={!createMode ? "default" : "outline"} size="sm" onClick={() => createMode && toggleCreateMode()} className="flex-1">
                  Upload CSV
                </Button>
                <Separator orientation="vertical" />
                <Button variant={createMode ? "default" : "outline"} size="sm" onClick={() => !createMode && toggleCreateMode()} className="flex-1">
                  Create Here
                </Button>
              </div>
            </div>

            <Separator />

            {/* Upload CSV Mode */}
            {!createMode && (
              <div className="space-y-3">
                <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} className="hidden" disabled={isUploading} />
                <Button variant="outline" onClick={triggerFileUpload} disabled={isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <span className="mr-2">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose CSV File
                    </>
                  )}
                </Button>
                {isUploading ? <Progress value={fakeProgress} className="h-2 w-full" /> : <p className="text-xs text-gray-500">Upload a CSV file with your dataset information. The file should have a column for labels and image paths or data.</p>}
              </div>
            )}

            {/* Create in Browser Mode */}
            {createMode && (
              <div className="space-y-4">
                {/* Add New Image Form */}
                <div className="p-4 border rounded-md space-y-3 shadow-sm">
                  <h3 className="text-sm font-medium">Add New Images</h3>

                  <div className="space-y-2">
                    <Label htmlFor="label">Label</Label>
                    <Input placeholder="Enter label for image" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Images</Label>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} ref={imageInputRef} className="hidden" />
                    <Button variant="outline" onClick={triggerImageUpload} className="w-full">
                      <Image className="w-4 h-4 mr-2" />
                      Select Images
                    </Button>
                  </div>

                  {currentPreviews &&
                    currentPreviews.map((preview, index) => (
                      <div key={index} className="mt-2">
                        <div className="relative w-24 h-24 mx-auto">
                          <img src={`data:image/png;base64,${preview}`} alt={`Preview ${index}`} className="w-full h-full object-cover rounded" />
                        </div>
                      </div>
                    ))}

                  <Button onClick={addDataRow} disabled={!newLabel || !currentPreviews.length} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Dataset
                  </Button>
                </div>

                {/* Dataset Preview */}
                {browserDataset.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Current Dataset ({browserDataset.length} items)</h3>
                      <Button variant="outline" size="sm" onClick={resetBrowserDataset} className="h-7">
                        Reset
                      </Button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {browserDataset.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-1 border-b last:border-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded overflow-hidden">
                              <img src={`data:image/png;base64,${item.image}`} alt={item.label} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeDataRow(index)} className="h-6 w-6 p-0">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create Dataset Button */}
                <Button onClick={handleCreateDatasetSubmit} disabled={browserDataset.length === 0 || isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <span className="mr-2">Creating Dataset...</span>
                      <Progress value={uploadProgress} className="h-1 w-12" />
                    </>
                  ) : (
                    "Create and Upload Dataset"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Block>
  )
}

export const ImportDataBlock: BlockType<ImportDataProps> = {
  hasInput: true,
  hasOutput: true,
  limit: 1,
  title: "Import Data",
  icon: <FileSpreadsheet className="w-4 h-4" />,
  width: 350,
  createNew: () => ({ datasetFile: null }),
  block(props) {
    return <ImportDataBlockComponent {...props} shouldSetPreprocessingData={true} />
  },
}

export const ResizeFilterBlock: BlockType<{
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

export const GrayscaleFilterBlock: BlockType<{}> = {
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

export const NormalizeFilterBlock: BlockType<{}> = {
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

export const ShufflingFilterBlock: BlockType<{}> = {
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

// Block registry
const allPpBlocks: BlockRegistry = {
  start: StartBlock,
  import: ImportDataBlock,
  resize: ResizeFilterBlock,
  grayscale: GrayscaleFilterBlock,
  normalize: NormalizeFilterBlock,
  shuffling: ShufflingFilterBlock,
  end: EndBlock,
}

export default allPpBlocks
