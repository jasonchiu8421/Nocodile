import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import React, { ReactNode } from "react"
import { BlockInstance } from "./dnd_layout"
import { BlockChain, SaveFunction } from "./save_alerts"
import { ProgressStep, useProgressStore } from "@/store/useProgressStore"
import { Button } from "./ui/button"

type BlockChainProps = {
  entire: BlockChain
  before: BlockChain
  after: BlockChain
}

export type CreateBlockElementProps<T> = {
  data: T
  id: string
  setData: (data: T) => void
  dragHandleProps?: any
  chain?: BlockChainProps
  blocks?: BlockInstance[]
  dragging: boolean
}

export type BlockType<T> = {
  hasInput?: boolean
  hasOutput?: boolean
  title: string
  icon: React.ReactNode
  width?: number
  limit?: number
  immortal?: boolean
  createNew: () => T
  block: (props: CreateBlockElementProps<T>) => React.ReactElement
}

export interface BlockRegistry {
  [key: string]: BlockType<any>
}

type BlockProps = {
  id: string
  title: string
  icon?: ReactNode
  color?: string
  width?: string
  children?: ReactNode
  dragHandleProps?: any
  onConnect?: (sourceId: string, targetId: string) => void
}

export type BlockViewItem = BlockInstance & {
  visible: boolean
}

export const BlockIO = ({ id, type, block, previewConnections, children }: { id: string; type: BlockType<any>; block?: BlockInstance; previewConnections?: { input: boolean; output: boolean }; children?: ReactNode }) => {
  return (
    <div
      id={`draggable/block/${id}`}
      className="relative cursor-auto"
      style={{
        width: type.width ?? 200,
      }}
    >
      {type.hasInput && (
        <div className="absolute left-0 top-4 -translate-x-4 flex items-center" data-connector-id={`${id}/input`} data-connector-type="input" data-connector-filled={block?.input !== null}>
          <div className="w-4 h-8 bg-blue-100 border-2 border-blue-500 rounded-l-md flex items-center justify-center">
            <div className={cn("w-2 h-4 bg-blue-100 rounded-full transition-colors duration-100", previewConnections?.input ? "bg-blue-500" : "border border-blue-500")} />
          </div>
        </div>
      )}

      {children}

      {type.hasOutput && (
        <div className="absolute right-0 top-4 translate-x-4 flex items-center" data-connector-id={`${id}/output`} data-connector-type="output" data-connector-filled={block?.output !== null}>
          <div className="w-4 h-8 bg-green-100 border-2 border-green-500 rounded-r-md flex items-center justify-center">
            <div className={cn("w-2 h-4 bg-green-100 rounded-full transition-colors duration-100", previewConnections?.output ? "bg-green-500" : "border border-green-500")} />
          </div>
        </div>
      )}

      {type.hasOutput && (
        <div className="absolute right-0 top-4 translate-x-4 flex items-center transition-opacity z-10" style={{ opacity: block?.output ? 1 : 0 }}>
          <div className="w-4 h-8 bg-gray-300 border-2 border-gray-500 flex items-center justify-center">
            <ChevronRight className="size-4 text-gray-600 stroke-3" />
          </div>
        </div>
      )}
    </div>
  )
}

export const Block = ({ title, icon, color = "bg-white", children, dragHandleProps }: BlockProps) => {
  return (
    <Card className={`${color} p-5 w-full shadow-md min-h-16`}>
      <div className="flex items-center gap-2 font-medium -m-5 p-5 pb-3 !cursor-move" {...dragHandleProps}>
        {icon}
        <span className="whitespace-nowrap">{title}</span>
      </div>
      {children}
    </Card>
  )
}

export function EndBlockComponent({
  id,
  blocks,
  dragHandleProps,
  saveFunc,
  stage,
  allBlocks,
  step,
  children,
  buttonText,
}: Omit<CreateBlockElementProps<{}>, "dragging"> & {
  saveFunc: SaveFunction
  stage: ProgressStep
  allBlocks: BlockRegistry
  step?: () => void
  children?: ReactNode
  buttonText?: string | ((complete: boolean) => string)
}) {
  const { isStepAvailable, isStepCompleted, completeStep } = useProgressStore()
  const saveFuncResult = blocks ? saveFunc.save(allBlocks, blocks) : null
  const canRun = saveFuncResult?.type === "success" && isStepAvailable(stage)
  const isCompleted = isStepCompleted(stage)
  const buttonTextFunc = buttonText ?? ((complete: boolean) => (complete ? "Run Again" : "Run"))

  return (
    <Block id={id} title="End" color={isCompleted ? "bg-green-100" : "bg-red-100"} icon={<div className={`w-4 h-4 rounded-full ${isCompleted ? "bg-green-500" : "bg-red-500"}`} />} dragHandleProps={dragHandleProps}>
      <div className="flex flex-col gap-4">
        {saveFuncResult?.type === "error" && <p className="text-xs text-red-900">{saveFuncResult.message}</p>}
        <Button
          variant="default"
          size="sm"
          className="w-full"
          disabled={!canRun}
          onClick={() => {
            console.log(`Run ${stage} code`)
            localStorage.setItem("testingPageVisited", "false");
            step?.()
            completeStep(stage)
          }}
        >
          {typeof buttonTextFunc === "function" ? buttonTextFunc(isCompleted) : buttonTextFunc}
        </Button>
        {children}
      </div>
    </Block>
  )
}
