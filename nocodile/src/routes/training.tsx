import { Block, BlockRegistry, BlockType, CreateBlockElementProps, EndBlockComponent } from "@/components/blocks/blocks"
import { BlockDrawer } from "@/components/blocks_drawer"
import { BlockInstance, DndLayout } from "@/components/dnd_layout"
import { SaveFunction, splitChain } from "@/components/save_alerts"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Toaster } from "@/components/ui/sonner"
import { trainModel } from "@/lib/server_hooks"
import { filterOutKeys } from "@/lib/utils"
import { useBlocksStore } from "@/store"
import { Database, Plus, Trash } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Layer types
type KernelSize = [number, number]
type PoolSize = [number, number]
type ActivationType = "relu" | "softmax" | "tanh"

interface BaseLayer {
  type: string
}

interface ActivationLayer extends BaseLayer {
  type: "Activation"
  activation: ActivationType
}

interface Conv2DLayer extends BaseLayer {
  type: "Conv2D"
  filters: number
  kernelSize: KernelSize
  activation: ActivationType
}

interface MaxPooling2DLayer extends BaseLayer {
  type: "MaxPooling2D"
  poolSize: PoolSize
}

interface GlobalMaxPooling2DLayer extends BaseLayer {
  type: "GlobalMaxPooling2D"
}

interface AveragePooling2DLayer extends BaseLayer {
  type: "AveragePooling2D"
  poolSize: PoolSize
}

interface GlobalAveragePooling2DLayer extends BaseLayer {
  type: "GlobalAveragePooling2D"
}

interface BatchNormalizationLayer extends BaseLayer {
  type: "BatchNormalization"
}

interface FlattenLayer extends BaseLayer {
  type: "Flatten"
}

interface DropoutLayer extends BaseLayer {
  type: "Dropout"
  rate: number
  activation: ActivationType
}

interface DenseLayer extends BaseLayer {
  type: "Dense"
  units: number
  activation: ActivationType
}

type Layer = ActivationLayer | Conv2DLayer | MaxPooling2DLayer | GlobalMaxPooling2DLayer | AveragePooling2DLayer | GlobalAveragePooling2DLayer | BatchNormalizationLayer | FlattenLayer | DropoutLayer | DenseLayer

type ConvolutionBlockProps = {
  approach: "train_test" | "train_test_val" | "kFold_val"
  isKFold: boolean
  kFold_k: number
  layers: Layer[]
}

type ClassificationBlockProps = {
  layers: Layer[]
  optimizer: "Adam" | "SGD" | "RMSprop" | "Adagrad" | "Adadelta" | "Nadam" | "Ftrl"
  loss: string
  lr: number
  epoch: number
  batch_size: number
}

type EndBlockProps = {
  results: null | {
    modelPath: string
    accuracyGraph: string
    lossGraph: string
    accuracyData: {
      epoch: number[]
      accuracy: number[]
      valAccuracy: number[]
    }
    lossData: {
      epoch: number[]
      loss: number[]
      valLoss: number[]
    }
  }
}

const saveFunc = SaveFunction.requireChainCount(1).then(
  SaveFunction.create((_, blocks) => {
    const chain = splitChain(blocks)

    if (chain[0][0].type !== "start") {
      return {
        type: "error",
        message: "The first block must be a Start block",
      }
    }

    if (chain[0][chain[0].length - 1].type !== "end") {
      return {
        type: "error",
        message: "The last block must be an End block",
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

const EndAndUploadBlockComponent = (props: CreateBlockElementProps<EndBlockProps>) => {
  const { chain, data, setData } = props
  const [isTraining, setIsTraining] = useState(false)
  const [convolution, setConvolution] = useState<ConvolutionBlockProps | null>(null)
  const [classification, setClassification] = useState<ClassificationBlockProps | null>(null)

  const { preprocessingData } = useBlocksStore()

  useEffect(() => {
    let convolutionBlock: BlockInstance | null = null
    let classificationBlock: BlockInstance | null = null

    if (chain) {
      convolutionBlock = chain.before.find((block) => block.type === "convolution") || null
      classificationBlock = chain.before.find((block) => block.type === "classification") || null
    }

    setConvolution(convolutionBlock?.data || null)
    setClassification(classificationBlock?.data || null)
  }, [chain])

  const startTraining = async () => {
    if (isTraining) return
    if (!convolution || !classification) {
      toast.error("Please attach a convolution and classification block to this block!")
      return
    } else if (!preprocessingData?.preprocessedPath && !preprocessingData?.uploadPath) {
      toast.error("Please first import and preprocess the dataset!")
      return
    }

    setIsTraining(true)
    setData({ results: null })

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    await sleep(500)

    trainModel({
      dataset_path: preprocessingData?.preprocessedPath || preprocessingData?.uploadPath || "",
      training_options: {
        method: convolution.approach,
        layers: [...classification.layers, ...convolution.layers],
        optimizer: classification.optimizer,
        loss: classification.loss,
        lr: classification.lr,
        epochs: classification.epoch,
        batch_size: classification.batch_size,
        kFold_k: convolution.kFold_k,
      },
    }).then((response) => {
      if (response.success) {
        setData({
          results: {
            modelPath: response.data["model path"],
            accuracyGraph: response.data["accuracy graph"],
            lossGraph: response.data["loss graph"],
            accuracyData: {
              epoch: response.data["accuracy data"].Epoch,
              accuracy: response.data["accuracy data"].Accuracy,
              valAccuracy: response.data["accuracy data"].Val_Accuracy,
            },
            lossData: {
              epoch: response.data["loss data"].Epoch,
              loss: response.data["loss data"].Loss,
              valLoss: response.data["loss data"].Val_Loss,
            },
          },
        })
        toast.success("Model trained successfully")
      } else {
        setData({ results: null })
        toast.error("Failed to train model", {
          description: response.error,
        })
      }
      setIsTraining(false)
    })
  }

  return <EndBlockComponent stage="training" saveFunc={saveFunc} allBlocks={allTrainingBlocks} data={{}} setData={() => {}} {...filterOutKeys(props, ["data", "setData"])} step={startTraining}>
    {data.results && <ResultsComponent results={data.results} />}
  </EndBlockComponent>
}

const ResultsComponent: React.FC<{ results: NonNullable<EndBlockProps["results"]> }> = ({ results }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Results</h2>
      <div className="flex flex-col space-y-2">
        <Label>Model Path</Label>
        <span className="text-sm">{results.modelPath}</span>
        <Label>Accuracy Graph</Label>
        <img src={`data:image/png;base64,${results.accuracyGraph}`} alt="Accuracy" />
        <Label>Loss Graph</Label>
        <img src={`data:image/png;base64,${results.lossGraph}`} alt="Loss" />
      </div>
    </div>
  )
}

const EndBlock: BlockType<EndBlockProps> = {
  hasInput: true,
  title: "End",
  icon: <div className="w-4 h-4 rounded-full bg-red-500" />,
  limit: 1,
  immortal: true,
  width: 340,
  createNew: () => ({
    results: null,
  }),
  block: (props) => <EndAndUploadBlockComponent {...props} />,
}

// Convolution
const ConvolutionBlock: BlockType<ConvolutionBlockProps> = {
  hasInput: true,
  hasOutput: true,
  title: "Convolution",
  icon: <Database className="w-5 h-5" />,
  width: 320,
  limit: 1,
  createNew: () => ({
    approach: "train_test",
    isKFold: false,
    kFold_k: 5,
    layers: [],
  }),
  block: ({ id, data, setData, dragHandleProps }) => (
    <Block id={id} title="Convolution" icon={<Database className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="approach">Approach</Label>
          <Select value={data.approach} onValueChange={(value) => setData({ ...data, approach: value as ConvolutionBlockProps["approach"] })}>
            <SelectTrigger id="approach" className="w-full">
              <SelectValue placeholder="Select approach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="train_test">Train test</SelectItem>
              <SelectItem value="train_test_val">Train test validation</SelectItem>
              <SelectItem value="kFold_val">K fold validation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.approach === "kFold_val" && (
          <div className="space-y-2">
            <Label htmlFor="kFold_k">K-Fold K Value</Label>
            <Input id="kFold_k" type="number" value={data.kFold_k.toString()} onChange={(e) => setData({ ...data, kFold_k: parseInt(e.target.value) })} min={2} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="layers">Layers</Label>
          <Accordion type="single" className="space-y-2 mt-1" collapsible>
            {data.layers.map((layer, index) => (
              <AccordionItem key={index} value={`layer-${index}`} className="!border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex justify-between w-full items-center">
                    <span>{layer.type}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent accordion from toggling
                        const newLayers = [...data.layers]
                        newLayers.splice(index, 1)
                        setData({ ...data, layers: newLayers })
                      }}
                      className="h-7 px-2 py-1 text-xs"
                    >
                      <Trash />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-3">
                  <div className="space-y-2">
                    <Label htmlFor={`layer-type-${index}`}>Type</Label>
                    <Select
                      value={layer.type}
                      onValueChange={(value) => {
                        let newLayer: Layer

                        switch (value) {
                          case "Activation":
                            newLayer = { type: "Activation", activation: "relu" }
                            break
                          case "Conv2D":
                            newLayer = { type: "Conv2D", filters: 32, kernelSize: [3, 3], activation: "relu" }
                            break
                          case "MaxPooling2D":
                            newLayer = { type: "MaxPooling2D", poolSize: [2, 2] }
                            break
                          case "GlobalMaxPooling2D":
                            newLayer = { type: "GlobalMaxPooling2D" }
                            break
                          case "AveragePooling2D":
                            newLayer = { type: "AveragePooling2D", poolSize: [2, 2] }
                            break
                          case "GlobalAveragePooling2D":
                            newLayer = { type: "GlobalAveragePooling2D" }
                            break
                          case "BatchNormalization":
                            newLayer = { type: "BatchNormalization" }
                            break
                          case "Flatten":
                            newLayer = { type: "Flatten" }
                            break
                          case "Dropout":
                            newLayer = { type: "Dropout", rate: 0.5, activation: "relu" }
                            break
                          case "Dense":
                            newLayer = { type: "Dense", units: 128, activation: "relu" }
                            break
                          default:
                            newLayer = { type: "Conv2D", filters: 32, kernelSize: [3, 3], activation: "relu" }
                        }

                        const newLayers = [...data.layers]
                        newLayers[index] = newLayer
                        setData({ ...data, layers: newLayers })
                      }}
                    >
                      <SelectTrigger id={`layer-type-${index}`} className="w-full">
                        <SelectValue placeholder="Select layer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activation">Activation</SelectItem>
                        <SelectItem value="Conv2D">Conv2D</SelectItem>
                        <SelectItem value="MaxPooling2D">MaxPooling2D</SelectItem>
                        <SelectItem value="GlobalMaxPooling2D">GlobalMaxPooling2D</SelectItem>
                        <SelectItem value="AveragePooling2D">AveragePooling2D</SelectItem>
                        <SelectItem value="GlobalAveragePooling2D">GlobalAveragePooling2D</SelectItem>
                        <SelectItem value="BatchNormalization">BatchNormalization</SelectItem>
                        <SelectItem value="Flatten">Flatten</SelectItem>
                        <SelectItem value="Dropout">Dropout</SelectItem>
                        <SelectItem value="Dense">Dense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                setData({
                  ...data,
                  layers: [
                    ...data.layers,
                    {
                      type: "Conv2D",
                      filters: 32,
                      kernelSize: [3, 3],
                      activation: "relu",
                    },
                  ],
                })
              }}
            >
              <Plus className="h-4 w-4" /> Add Layer
            </Button>
          </Accordion>
        </div>
      </div>
    </Block>
  ),
}

// Classification
const ClassificationBlock: BlockType<ClassificationBlockProps> = {
  hasInput: true,
  hasOutput: true,
  title: "Classification",
  icon: <Database className="w-5 h-5" />,
  width: 320,
  limit: 1,
  createNew: () => ({
    layers: [],
    optimizer: "Adam",
    loss: "categorical_crossentropy",
    lr: 0.01,
    epoch: 10,
    batch_size: 64,
  }),
  block: ({ id, data, setData, dragHandleProps }) => (
    <Block id={id} title="Classification" icon={<Database className="w-5 h-5" />} dragHandleProps={dragHandleProps}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="layers">Layers</Label>
          <Accordion type="single" className="space-y-2 mt-1" collapsible>
            {data.layers.map((layer, index) => (
              <AccordionItem key={index} value={`layer-${index}`} className="!border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex justify-between w-full items-center">
                    <span>{layer.type}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent accordion from toggling
                        const newLayers = [...data.layers]
                        newLayers.splice(index, 1)
                        setData({ ...data, layers: newLayers })
                      }}
                      className="h-7 px-2 py-1 text-xs"
                    >
                      <Trash />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-3 space-y-2">
                  <Label htmlFor={`layer-type-${index}`}>Type</Label>
                  <Select
                    value={layer.type}
                    onValueChange={(value) => {
                      let newLayer: Layer

                      switch (value) {
                        case "Dense":
                          newLayer = { type: "Dense", units: 512, activation: "relu" }
                          break
                        case "Dropout":
                          newLayer = { type: "Dropout", rate: 0.3, activation: "relu" }
                          break
                        default:
                          return
                      }
                      const newLayers = [...data.layers]
                      newLayers[index] = newLayer
                      setData({ ...data, layers: newLayers })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select layer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dense">Dense</SelectItem>
                      <SelectItem value="Dropout">Dropout</SelectItem>
                    </SelectContent>
                  </Select>

                  {layer.type === "Dense" && (
                    <div className="space-y-2">
                      <Label htmlFor={`units-${index}`}>Units</Label>
                      <Input
                        id={`units-${index}`}
                        type="number"
                        value={(layer as DenseLayer).units.toString()}
                        onChange={(e) => {
                          const newLayers = [...data.layers]
                          newLayers[index] = { ...layer, units: parseInt(e.target.value) }
                          setData({ ...data, layers: newLayers })
                        }}
                        placeholder="Number of units"
                      />
                    </div>
                  )}

                  {layer.type === "Dropout" && (
                    <div className="space-y-2">
                      <Label htmlFor={`rate-${index}`}>Rate</Label>
                      <Input
                        id={`rate-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={(layer as DropoutLayer).rate.toString()}
                        onChange={(e) => {
                          const newLayers = [...data.layers]
                          newLayers[index] = { ...layer, rate: parseFloat(e.target.value) }
                          setData({ ...data, layers: newLayers })
                        }}
                        placeholder="Dropout rate"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`activation-${index}`}>Activation</Label>
                    <Select
                      value={layer.type === "Dense" || layer.type === "Dropout" ? layer.activation : "relu"}
                      onValueChange={(value) => {
                        const newLayers = [...data.layers]
                        if (layer.type === "Dense" || layer.type === "Dropout") {
                          newLayers[index] = { ...layer, activation: value as ActivationType }
                          setData({ ...data, layers: newLayers })
                        }
                      }}
                    >
                      <SelectTrigger id={`activation-${index}`} className="w-full">
                        <SelectValue placeholder="Select activation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relu">ReLU</SelectItem>
                        <SelectItem value="softmax">Softmax</SelectItem>
                        <SelectItem value="tanh">Tanh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => {
              const newLayer = { type: "Dense", units: 512, activation: "relu" } as DenseLayer
              setData({ ...data, layers: [...data.layers, newLayer] })
            }}
          >
            <Plus className="h-4 w-4" /> Add Layer
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="optimizer">Optimizer</Label>
          <Select value={data.optimizer} onValueChange={(value) => setData({ ...data, optimizer: value as ClassificationBlockProps["optimizer"] })}>
            <SelectTrigger id="optimizer" className="w-full">
              <SelectValue placeholder="Select optimizer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Adam">Adam</SelectItem>
              <SelectItem value="SGD">SGD</SelectItem>
              <SelectItem value="RMSprop">RMSprop</SelectItem>
              <SelectItem value="Adagrad">Adagrad</SelectItem>
              <SelectItem value="Adadelta">Adadelta</SelectItem>
              <SelectItem value="Nadam">Nadam</SelectItem>
              <SelectItem value="Ftrl">Ftrl</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loss">Loss</Label>
          <Select value={data.loss} onValueChange={(value) => setData({ ...data, loss: value })}>
            <SelectTrigger id="loss" className="w-full">
              <SelectValue placeholder="Select loss function" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="categorical_crossentropy">categorical_crossentropy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="learning-rate">Learning Rate:</Label>
            <Input id="learning-rate" type="number" min="0.001" max="0.1" step="0.001" value={data.lr.toString()} onChange={(e) => setData({ ...data, lr: parseFloat(e.target.value) })} className="w-20 text-right" />
          </div>
          <Slider defaultValue={[data.lr]} min={0.001} max={0.1} step={0.001} onValueChange={(value) => setData({ ...data, lr: value[0] })} className="w-full" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="epochs">Epochs:</Label>
            <Input id="epochs" type="number" min="1" max="100" step="1" value={data.epoch.toString()} onChange={(e) => setData({ ...data, epoch: parseInt(e.target.value) })} className="w-20 text-right" />
          </div>
          <Slider defaultValue={[data.epoch]} min={1} max={100} step={1} onValueChange={(value) => setData({ ...data, epoch: value[0] })} className="w-full" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="batch-size">Batch Size:</Label>
            <Input id="batch-size" type="number" min="8" max="256" step="8" value={data.batch_size.toString()} onChange={(e) => setData({ ...data, batch_size: parseInt(e.target.value) })} className="w-20 text-right" />
          </div>
          <Slider defaultValue={[data.batch_size]} min={8} max={256} step={8} onValueChange={(value) => setData({ ...data, batch_size: value[0] })} className="w-full" />
        </div>
      </div>
    </Block>
  ),
}

// Block registry for training blocks
export const allTrainingBlocks: BlockRegistry = {
  start: StartBlock,
  end: EndBlock,
  convolution: ConvolutionBlock,
  classification: ClassificationBlock,
}

export default function TrainingRoute() {
  const { trainingBlocks, setTrainingBlocks, inactiveTrainingBlocks } = useBlocksStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Training Blocks</h2>
        <Button variant="default" size="sm">
          Submit
        </Button>
      </div>
      <BlockDrawer blockRegistry={allTrainingBlocks} inactiveBlocks={inactiveTrainingBlocks} className="flex-1" />
    </div>
  )

  return (
    <>
      <DndLayout
        title="Model Training"
        sidebarContent={sidebarContent}
        blockRegistry={allTrainingBlocks}
        blocks={trainingBlocks}
        setBlocks={setTrainingBlocks}
        defaultBlocks={() => [
          {
            id: "block-1",
            type: "start",
            data: {},
            position: { x: 100, y: 100 },
            input: null,
            output: null,
          },
          {
            id: "block-2",
            type: "end",
            data: {},
            position: { x: 500, y: 100 },
            input: null,
            output: null,
          },
        ]}
        save={saveFunc}
      />
      <Toaster visibleToasts={10} />
    </>
  )
}
