import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import React, { ReactNode, useEffect, useRef, useState } from "react"
import { BlockIO, BlockRegistry, BlockViewItem } from "./blocks"

// Draggable block component for the canvas
export function DraggableBlock({
  block,
  children,
}: {
  block: BlockViewItem
  children: (dragHandleProps: any) => React.ReactNode
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
    <div ref={setNodeRef} style={style} className="cursor-move">
      {children({ ...listeners, ...attributes })}
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

type BlocksViewProps = {
  blockRegistry: BlockRegistry
  blocks: BlockViewItem[]
  onMove: (position: { x: number; y: number }) => void
}

export function BlocksView({ blockRegistry, blocks, onMove }: BlocksViewProps) {
  const dndContext = useDndContext()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Canvas boundary limits
  const [canvasLimits, setCanvasLimits] = useState({
    minX: -1700,
    maxX: 0,
    minY: -1700,
    maxY: 0,
  })

  const calculateRealLimits = () => ({
    minX: canvasLimits.minX + (containerRef.current?.clientWidth || 0) / 2,
    maxX: Math.max(
      0,
      canvasLimits.maxX - (containerRef.current?.clientWidth || 0) / 2
    ),
    minY: canvasLimits.minY + (containerRef.current?.clientHeight || 0) / 2,
    maxY: Math.max(
      0,
      canvasLimits.maxY - (containerRef.current?.clientHeight || 0) / 2
    ),
  })

  const [realLimits, setRealLimits] = useState(calculateRealLimits())

  useEffect(() => {
    setRealLimits(calculateRealLimits())
    const constrainedX = Math.min(
      Math.max(position.x, realLimits.minX),
      realLimits.maxX
    )
    const constrainedY = Math.min(
      Math.max(position.y, realLimits.minY),
      realLimits.maxY
    )
    setPosition({ x: constrainedX, y: constrainedY })
  }, [
    canvasLimits,
    containerRef.current?.clientWidth,
    containerRef.current?.clientHeight,
  ])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start panning if not clicking on a block
    if ((e.target as HTMLElement).closest(".block-item") || dndContext.active) {
      return
    }

    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      // Calculate new position
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Apply boundary constraints
      const constrainedX = Math.min(
        Math.max(newX, realLimits.minX),
        realLimits.maxX
      )
      const constrainedY = Math.min(
        Math.max(newY, realLimits.minY),
        realLimits.maxY
      )

      setPosition({
        x: constrainedX,
        y: constrainedY,
      })

      console.log(constrainedX, constrainedY)
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
      className="relative w-full h-full overflow-hidden bg-zinc-100 rounded-md border-2 border-gray-300"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Visual indicator for canvas bounds - red gradient */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${-realLimits.maxX}px`,
          top: `${-realLimits.maxY}px`,
          width: `${
            realLimits.maxX -
            realLimits.minX +
            (containerRef.current?.clientWidth || 0)
          }px`,
          height: `${
            realLimits.maxY -
            realLimits.minY +
            (containerRef.current?.clientHeight || 0)
          }px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          background:
            "linear-gradient(to right, rgba(0,255,100,0.2) 0%, rgba(0,255,100,0) 1%, rgba(0,255,100,0) 99%, rgba(0,255,100,0.2) 100%), linear-gradient(to bottom, rgba(0,255,100,0.2) 0%, rgba(0,255,100,0) 1%, rgba(0,255,100,0) 99%, rgba(0,255,100,0.2) 100%)",
        }}
      />

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
                  display: block.visible ? "block" : "none",
                  left: block.position.x,
                  top: block.position.y,
                }}
              >
                <DraggableBlock
                  block={block}
                  children={(props) => {
                    const type = blockRegistry[block.type]
                    if (!type) return null
                    return (
                      <BlockIO id={block.id} type={type} block={block}>
                        {type.block(block.data, block.id, { ...props })}
                      </BlockIO>
                    )
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </DroppableCanvas>
    </div>
  )
}
