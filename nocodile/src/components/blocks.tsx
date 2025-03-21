import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import React, { ReactNode } from "react"
import { BlockInstance } from "./dnd_layout"

export type BlockType<T> = {
  hasInput?: boolean
  hasOutput?: boolean
  title: string
  icon: React.ReactNode
  limit?: number
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
  className?: string
}

export type BlockViewItem = BlockInstance & {
  visible: boolean
}

export const BlockIO = ({
  id,
  type,
  block,
  previewConnections,
  children,
}: {
  id: string
  type: BlockType<any>
  block?: BlockInstance
  previewConnections?: { input: boolean; output: boolean }
  children?: ReactNode
}) => {
  return (
    <div id={`draggable/block/${id}`} className="relative cursor-auto w-50">
      {type.hasInput && (
        <div
          className="absolute left-0 top-4 -translate-x-4 flex items-center"
          data-connector-id={`${id}/input`}
          data-connector-type="input"
          data-connector-filled={block?.input !== null}
        >
          <div className="w-4 h-8 bg-blue-100 border-2 border-blue-500 rounded-l-md flex items-center justify-center">
            <div className={cn("w-2 h-4 bg-blue-100 rounded-full transition-colors duration-100",
              previewConnections?.input ? "bg-blue-500" : "border border-blue-500"
            )} />
          </div>
        </div>
      )}
      {children}
      {type.hasOutput && (
        <div
          className="absolute right-0 top-4 translate-x-4 flex items-center"
          data-connector-id={`${id}/output`}
          data-connector-type="output"
          data-connector-filled={block?.output !== null}
        >
          <div className="w-4 h-8 bg-green-100 border-2 border-green-500 rounded-r-md flex items-center justify-center">
            <div className={cn("w-2 h-4 bg-green-100 rounded-full transition-colors duration-100",
              previewConnections?.output ? "bg-green-500" : "border border-green-500"
            )} />
          </div>
        </div>
      )}
      {type.hasOutput && block?.output && (
        <div
          className="absolute right-0 top-4 translate-x-4 flex items-center transition-opacity z-10"
          style={{ opacity: block?.output ? 1 : 0 }}
        >
          <div className="w-4 h-8 bg-gray-300 border-2 border-gray-500 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  )
}

export function Block({
  title,
  icon,
  color = "bg-white",
  children,
  dragHandleProps,
  className,
}: BlockProps) {
  return (
    <Card
      className={cn(
        "w-[200px] overflow-hidden shadow-md",
        color,
        className
      )}
    >
      <div
        className="flex items-center gap-2 p-2 border-b cursor-move"
        {...dragHandleProps}
      >
        {icon}
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="p-2">{children}</div>
    </Card>
  )
}
