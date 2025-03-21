import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState, WheelEvent } from "react"
import { BlockIO, BlockRegistry, BlockType, BlockViewItem } from "./blocks"
import { BlockInstance } from "./dnd_layout"
import { Button } from "./ui/button"
import { BlockChain, splitChain } from "./save_alerts"

// Draggable block component for the canvas
export function DraggableBlock({ block, children }: { block: BlockViewItem; children: (dragHandleProps: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
    data: {
      type: "block",
      origin: "canvas",
      blockId: block.id,
      blockType: block.type,
      blockData: block.data,
      blockPosition: block.position,
      data: block.data,
    },
  })

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
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
  setBlocks: (blocks: BlockInstance[]) => void
  onMove: (position: { x: number; y: number }) => void
  onZoom?: (scale: number) => void
}

export function BlocksView({ blockRegistry, blocks, setBlocks, onMove, onZoom }: BlocksViewProps) {
  const dndContext = useDndContext()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const chains = splitChain(blocks)

  // Canvas boundary limits
  const [canvasLimits, setCanvasLimits] = useState({
    minX: -1700,
    maxX: 0,
    minY: -1700,
    maxY: 0,
  })

  const calculateRealLimits = useCallback(
    () => ({
      minX: canvasLimits.minX + (containerRef.current?.clientWidth || 0) / 2,
      maxX: Math.max(0, canvasLimits.maxX - (containerRef.current?.clientWidth || 0) / 2),
      minY: canvasLimits.minY + (containerRef.current?.clientHeight || 0) / 2,
      maxY: Math.max(0, canvasLimits.maxY - (containerRef.current?.clientHeight || 0) / 2),
    }),
    [canvasLimits, containerRef.current?.clientWidth, containerRef.current?.clientHeight]
  )

  const [realLimits, setRealLimits] = useState(calculateRealLimits())

  const calculateZoomedRealLimits = useCallback(
    () => ({
      minX: canvasLimits.minX * scale + (containerRef.current?.clientWidth || 0) / 2 / scale,
      maxX: Math.max(0, canvasLimits.maxX * scale - (containerRef.current?.clientWidth || 0) / 2 / scale),
      minY: canvasLimits.minY * scale + (containerRef.current?.clientHeight || 0) / 2 / scale,
      maxY: Math.max(0, canvasLimits.maxY * scale - (containerRef.current?.clientHeight || 0) / 2 / scale),
    }),
    [realLimits, scale]
  )

  const [zoomedRealLimits, setZoomedRealLimits] = useState(calculateZoomedRealLimits())

  useEffect(() => {
    setRealLimits(calculateRealLimits())
  }, [calculateRealLimits])

  useEffect(() => {
    const zoomedRealLimits = calculateZoomedRealLimits()
    setZoomedRealLimits(zoomedRealLimits)
    const constrainedX = Math.min(Math.max(position.x, zoomedRealLimits.minX), zoomedRealLimits.maxX)
    const constrainedY = Math.min(Math.max(position.y, zoomedRealLimits.minY), zoomedRealLimits.maxY)
    setPosition({ x: constrainedX, y: constrainedY })
  }, [calculateZoomedRealLimits])

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
      const constrainedX = Math.min(Math.max(newX, zoomedRealLimits.minX), zoomedRealLimits.maxX)
      const constrainedY = Math.min(Math.max(newY, zoomedRealLimits.minY), zoomedRealLimits.maxY)

      setPosition({
        x: constrainedX,
        y: constrainedY,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()

    // Get the delta value for scrolling
    const delta = Math.sign(e.deltaY)
    const scrollAmount = 10 * delta // Base scroll amount

    if (e.ctrlKey) {
      // Ctrl + scroll for zooming
      const zoomDelta = -delta // Invert delta for intuitive zoom direction
      // Calculate new scale with limits
      const newScale = Math.min(Math.max(scale + zoomDelta * 0.01, 0.5), 3)

      // Get mouse position relative to container
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Calculate the point on the canvas where the mouse is pointing
      const pointX = mouseX - position.x
      const pointY = mouseY - position.y

      // Calculate how the position should change to keep the point under the mouse
      const newPosition = {
        x: mouseX - pointX * (newScale / scale),
        y: mouseY - pointY * (newScale / scale),
      }

      // Apply boundary constraints
      const constrainedX = Math.min(Math.max(newPosition.x, zoomedRealLimits.minX), zoomedRealLimits.maxX)
      const constrainedY = Math.min(Math.max(newPosition.y, zoomedRealLimits.minY), zoomedRealLimits.maxY)

      setScale(newScale)
      setPosition({
        x: constrainedX,
        y: constrainedY,
      })
    } else if (e.shiftKey) {
      // Shift + scroll for horizontal movement
      const newX = position.x - scrollAmount

      // Apply boundary constraints
      const constrainedX = Math.min(Math.max(newX, zoomedRealLimits.minX), zoomedRealLimits.maxX)

      setPosition({
        x: constrainedX,
        y: position.y,
      })
    } else {
      // Regular scroll for vertical movement
      const newY = position.y - scrollAmount

      // Apply boundary constraints
      const constrainedY = Math.min(Math.max(newY, zoomedRealLimits.minY), zoomedRealLimits.maxY)

      setPosition({
        x: position.x,
        y: constrainedY,
      })
    }
  }

  // Handle zoom in button click
  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.1, 3)
    setScale(newScale)
  }

  // Handle zoom out button click
  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.1, 0.5)
    setScale(newScale)
  }

  // Handle reset zoom and position
  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  useEffect(() => {
    onMove(position)
  }, [position])

  useEffect(() => {
    if (onZoom) {
      onZoom(scale)
    }
  }, [scale, onZoom])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-zinc-100 rounded-md border-2 border-gray-300" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
      {/* Visual indicator for canvas bounds - red gradient */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${-realLimits.maxX}px`,
          top: `${-realLimits.maxY}px`,
          width: `${realLimits.maxX - realLimits.minX + (containerRef.current?.clientWidth || 0)}px`,
          height: `${realLimits.maxY - realLimits.minY + (containerRef.current?.clientHeight || 0)}px`,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          background: "linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 0.5%, rgba(0,0,0,0) 99.5%, rgba(0,0,0,0.3) 100%), linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 0.5%, rgba(0,0,0,0) 99.5%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      <div
        className="absolute w-100000 h-100000 bg-[radial-gradient(#d5d7db_1px,transparent_1px)] [background-size:16px_16px]"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
        }}
      />
      <DroppableCanvas>
        <div
          className="absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
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
                ref={(node) => {
                  if (node) {
                    blockRefs.current.set(block.id, node)
                  } else {
                    blockRefs.current.delete(block.id)
                  }
                }}
              >
                <DraggableBlock
                  block={block}
                  children={(props) => {
                    const type = blockRegistry[block.type]
                    if (!type) return null
                    return (
                      <BlockIO id={block.id} type={type} block={block}>
                        <BlockFunction type={type} block={block} blocks={blocks} chains={chains} setBlocks={setBlocks} props={props}/>
                      </BlockIO>
                    )
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </DroppableCanvas>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        {/* Minimap */}
        <Minimap blocks={blocks} realLimits={realLimits} containerRef={containerRef} blockRefs={blockRefs} canvasLimits={canvasLimits} scale={scale} position={position} />

        {/* Zoom controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In" className="bg-white/90 backdrop-blur-sm shadow-md">
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out" className="bg-white/90 backdrop-blur-sm shadow-md">
            <ZoomOut className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset} title="Reset View" className="bg-white/90 backdrop-blur-sm shadow-md">
            <RotateCcw className="size-4" />
          </Button>

          {/* Zoom level indicator */}
          <div className="bg-white/90 backdrop-blur-sm h-9 grow flex items-center justify-center border rounded-md shadow-md text-sm font-medium px-3">{Math.round(scale * 100)}%</div>
        </div>
      </div>
    </div>
  )
}

function BlockFunction({type, block, blocks, chains, setBlocks, props}: {
  type: BlockType<any>,
  block: BlockInstance,
  blocks: BlockInstance[],
  chains: BlockChain[],
  setBlocks: (blocks: BlockInstance[]) => void
  props: any
}) {
  const chain = chains.find(chain => chain.find(b => b.id === block.id))
  return type.block({
    data: block.data,
    id: block.id,
    setData: (data) => {
      setBlocks(
        blocks.map((b) => {
          if (block.id === b.id) {
            return {
              ...b,
              data: { ...data },
            }
          } else {
            return b
          }
        })
      )
    },
    chain: chain ? {
      entire: chain,
      before: chain.slice(0, chain.findIndex(b => b.id === block.id)),
      after: chain.slice(chain.findIndex(b => b.id === block.id) + 1),
    } : undefined,
    dragHandleProps: { ...props }
  })
}

function Minimap({
  blocks,
  realLimits,
  containerRef,
  blockRefs,
  canvasLimits,
  scale,
  position,
}: {
  blocks: BlockInstance[]
  realLimits: { minX: number; maxX: number; minY: number; maxY: number }
  containerRef: React.RefObject<HTMLDivElement | null>
  blockRefs: React.RefObject<Map<string, HTMLDivElement>>
  canvasLimits: { minX: number; maxX: number; minY: number; maxY: number }
  scale: number
  position: { x: number; y: number }
}) {
  return (
    <div className="w-52 h-36 bg-white rounded-md shadow-md overflow-hidden border border-gray-200 z-10">
      <div className="w-full h-full bg-zinc-50 relative">
        {/* Minimap content */}
        <div className="absolute inset-2 bg-[radial-gradient(#d5d7db_1px,transparent_1px)] [background-size:4px_4px]">
          {/* Blocks representation in minimap */}
          {blocks.map((block) => (
            <div
              key={`minimap-${block.id}`}
              className="absolute bg-zinc-200 rounded border border-zinc-300"
              style={{
                left: `${((block.position.x + realLimits.maxX + (containerRef.current?.clientWidth || 0) / 2) / (canvasLimits.maxX - canvasLimits.minX + (containerRef.current?.clientWidth || 0))) * 100}%`,
                top: `${((block.position.y + realLimits.maxY + (containerRef.current?.clientHeight || 0) / 2) / (canvasLimits.maxY - canvasLimits.minY + (containerRef.current?.clientHeight || 0))) * 100}%`,
                width: `${((blockRefs.current.get(block.id)?.clientWidth || 0) / (canvasLimits.maxX - canvasLimits.minX) / scale) * 100}%`,
                height: `${((blockRefs.current.get(block.id)?.clientHeight || 0) / (canvasLimits.maxY - canvasLimits.minY) / scale) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Viewport indicator */}
          <div
            className="absolute border-2 border-red-500 pointer-events-none"
            style={{
              left: `${((-position.x + realLimits.maxX + (containerRef.current?.clientWidth || 0) / 2) / (realLimits.maxX - realLimits.minX + (containerRef.current?.clientWidth || 0))) * 100}%`,
              top: `${((-position.y + realLimits.maxY + (containerRef.current?.clientHeight || 0) / 2) / (realLimits.maxY - realLimits.minY + (containerRef.current?.clientHeight || 0))) * 100}%`,
              width: `${((containerRef.current?.clientWidth || 0) / (canvasLimits.maxX - canvasLimits.minX) / scale) * 100}%`,
              height: `${((containerRef.current?.clientHeight || 0) / (canvasLimits.maxY - canvasLimits.minY) / scale) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>
    </div>
  )
}
