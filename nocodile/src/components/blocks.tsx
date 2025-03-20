import { Card } from "@/components/ui/card"
import React, { ReactNode } from "react"
import { BlockInstance } from "./dnd_layout"
import { ChevronRight } from "lucide-react"

export type BlockType<T> = {
  hasInput?: boolean
  hasOutput?: boolean
  title: string
  icon: React.ReactNode
  createNew: () => T
  block: (data: T, id: string, dragHandleProps?: any) => React.ReactElement
}

export interface BlockRegistry {
  [key: string]: BlockType<any>
}

type BlockProps = {
  id: string
  title: string
  icon?: ReactNode
  color?: string
  children?: ReactNode
  dragHandleProps?: any
  onConnect?: (sourceId: string, targetId: string) => void
}

export type BlockViewItem = BlockInstance & {
  visible: boolean
}

export const BlockIO = ({
  id,
  type,
  block,
  children,
}: {
  id: string
  type: BlockType<any>
  block?: BlockInstance
  children?: ReactNode
}) => {
  return (
    <div id={`draggable/block/${id}`} className="relative cursor-auto w-50">
      {type.hasInput && (
        <div
          className="absolute left-0 top-4 -translate-x-4 flex items-center"
          data-connector-id={`${id}/input`}
          data-connector-type="input"
        >
          <div className="w-4 h-8 bg-blue-100 border-2 border-blue-500 rounded-l-md flex items-center justify-center">
            <div className="w-2 h-4 bg-blue-100 rounded-full border border-blue-500" />
          </div>
        </div>
      )}

      {children}

      {type.hasOutput && (
        <div
          className="absolute right-0 top-4 translate-x-4 flex items-center"
          data-connector-id={`${id}/output`}
          data-connector-type="output"
        >
          <div className="w-4 h-8 bg-green-100 border-2 border-green-500 rounded-r-md flex items-center justify-center">
            <div className="w-2 h-4 bg-green-100 rounded-full border border-green-500" />
          </div>
        </div>
      )}

      {type.hasOutput && (
        <div className="absolute right-0 top-4 translate-x-4 flex items-center transition-opacity z-10" style={{ opacity: block?.output ? 1 : 0 }}>
          <div className="w-4 h-8 bg-gray-300 border-2 border-gray-500 flex items-center justify-center">
            <ChevronRight className="size-4 text-gray-600 stroke-3"/>
          </div>
        </div>
      )}
    </div>
  )
}

export const Block = ({
  title,
  icon,
  color = "bg-white",
  children,
  dragHandleProps,
}: BlockProps) => {
  return (
    <Card className={`${color} p-5 w-50 shadow-md min-h-16`}>
      <div
        className="flex items-center gap-2 font-medium -m-5 p-5 pb-3 !cursor-move"
        {...dragHandleProps}
      >
        {icon}
        <span className="whitespace-nowrap">{title}</span>
      </div>
      {children}
    </Card>
  )
}
