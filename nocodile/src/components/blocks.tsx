import { Card } from "@/components/ui/card"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import React, { ReactNode, useEffect, useRef, useState } from "react"

export type BlockType<T> = {
  hasInput?: boolean
  hasOutput?: boolean
  title: string
  icon: React.ReactNode
  createNew: () => T
  block: (data: T, id: string) => React.ReactElement
}

export interface BlockRegistry {
  [key: string]: BlockType<any>
}

type BlockInputOutput = {
  id: string
  type: string
}

type BlockProps = {
  id: string
  title: string
  icon?: ReactNode
  color?: string
  input?: BlockInputOutput
  output?: BlockInputOutput
  children?: ReactNode
  onConnect?: (sourceId: string, targetId: string) => void
}

export type BlockViewItem = {
  id: string
  type: string
  data: any
  position: { x: number; y: number }
  element: React.ReactNode
}

type BlocksViewProps = {
  blocks: BlockViewItem[]
  onMove: (position: { x: number; y: number }) => void
}

export const Block = ({
  id,
  title,
  icon,
  color = "bg-white",
  input,
  output,
  children,
}: BlockProps) => {
  return (
    <div className="relative">
      {/* Input connector (hole) */}
      {input && (
        <div
          className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 flex items-center"
          data-connector-id={`${id}-input`}
          data-connector-type="input"
        >
          <div className="w-4 h-8 bg-blue-100 border-2 border-blue-500 rounded-l-md flex items-center justify-center">
            <div className="w-2 h-4 bg-blue-100 rounded-full border border-blue-500" />
          </div>
        </div>
      )}

      {/* Block body */}
      <Card className={`${color} p-4 min-w-64 shadow-md`}>
        <div className="flex items-center gap-2 font-medium">
          {icon}
          <span className="whitespace-nowrap">{title}</span>
        </div>
        {children}
      </Card>

      {/* Output connector (nob) */}
      {output && (
        <div
          className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 flex items-center"
          data-connector-id={`${id}-output`}
          data-connector-type="output"
        >
          <div className="w-4 h-8 bg-green-100 border-2 border-green-500 rounded-r-md flex items-center justify-center">
            <div className="w-2 h-4 bg-green-500 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}

// Draggable block component for the canvas
export function DraggableBlock({
  block,
  children,
}: {
  block: BlockViewItem
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
    data: {
      type: "block",
      origin: "canvas",
      blockId: block.id,
      blockType: block.type,
      blockData: block.data,
      blockPosition: block.position,
    },
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-move"
    >
      {children}
    </div>
  )
}

export function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: "canvas",
  })

  return (
    <div ref={setNodeRef} className="w-full h-full" data-droppable="true">
      {children}
    </div>
  )
}

export function BlocksView({ blocks, onMove }: BlocksViewProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start panning if not clicking on a block
    if ((e.target as HTMLElement).closest(".block-item")) {
      return
    }

    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    onMove(position)
  }, [position])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-zinc-100 rounded-md"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute w-100000 h-100000 bg-[radial-gradient(#d5d7db_1px,transparent_1px)] [background-size:16px_16px]"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      />
      <DroppableCanvas>
        <div
          className="absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <div className="relative">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="absolute block-item"
                style={{
                  left: block.position.x,
                  top: block.position.y,
                }}
              >
                <DraggableBlock block={block}>{block.element}</DraggableBlock>
              </div>
            ))}
          </div>
        </div>
      </DroppableCanvas>
    </div>
  )
}
