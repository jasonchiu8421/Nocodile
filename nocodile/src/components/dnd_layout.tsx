import { BlockRegistry, BlocksView, BlockViewItem } from "@/components/blocks"
import { RouteBreadcrumb } from "@/components/routes_breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import { ReactNode, useCallback, useState } from "react"

export type BlockInstance = {
  id: string
  type: string
  data: any
  position: { x: number; y: number }
}

type DndLayoutProps = {
  title: string
  description?: string
  sidebarContent: ReactNode
  blockRegistry: BlockRegistry
}

export function DndLayout({
  title,
  description,
  sidebarContent,
  blockRegistry,
}: DndLayoutProps) {
  const [blocks, setBlocks] = useState<BlockInstance[]>([])
  const [nextBlockId, setNextBlockId] = useState(1)
  const [activeDragItem, setActiveDragItem] = useState<string | null>(null)
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 })

  // Track drag start coordinates
  const [dragStartCoordinates, setDragStartCoordinates] = useState<{
    x: number
    y: number
  } | null>(null)

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.type === "block") {
      setActiveDragItem(event.active.data.current.blockType)

      if (
        event.active.data.current?.origin === "drawer" &&
        "clientX" in event.activatorEvent &&
        "clientY" in event.activatorEvent
      ) {
        const { clientX, clientY } = event.activatorEvent as PointerEvent

        const element = document.getElementById(
          `draggable/drawer/${event.active.id}`
        )
        if (!element) return

        const rect = element.getBoundingClientRect()
        const offsetX = clientX - rect.left
        const offsetY = clientY - rect.top

        setDragStartCoordinates({ x: offsetX, y: offsetY })
      }
    }
  }, [])

  // Handle drag end from DndContext
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      setActiveDragItem(null)

      // Handle deletion when dropped on the blocks drawer
      if (
        over?.id === "blocks-drawer" &&
        active.data.current?.origin === "canvas"
      ) {
        // Remove the block from the blocks array
        setBlocks(blocks.filter((b) => b.id !== active.data.current?.blockId))
        return
      }

      // Only process if we have a valid drop target and active item
      if (over?.id === "canvas") {
        // Get the position from the event
        // We need to calculate this based on the canvas position
        const canvasElement = document.getElementById("canvas-container")
        if (!canvasElement) return

        let block = null as BlockInstance | null

        if (active.data.current?.type === "block") {
          if (active.data.current?.origin === "canvas") {
            block = {
              id: active.data.current.blockId,
              type: active.data.current.blockType,
              data: active.data.current.blockData,
              position: {
                x: active.data.current.blockPosition.x + event.delta.x,
                y: active.data.current.blockPosition.y + event.delta.y,
              },
            }
            setBlocks(
              blocks.filter((b) => b.id !== active.data.current?.blockId)
            )
          } else if (active.data.current?.origin === "drawer") {
            const rect = canvasElement.getBoundingClientRect()
            const clientX =
              ("clientX" in event.activatorEvent
                ? (event.activatorEvent as MouseEvent).clientX
                : 0) +
              event.delta.x -
              rect.left
            const clientY =
              ("clientY" in event.activatorEvent
                ? (event.activatorEvent as MouseEvent).clientY
                : 0) +
              event.delta.y -
              rect.top

            const dragOffset = dragStartCoordinates || { x: 0, y: 0 }

            console.log(
              `clientX: ${clientX}, clientY: ${clientY}, viewPosition: {x: ${viewPosition.x}, y: ${viewPosition.y}}, dragOffset: {x: ${dragOffset.x}, y: ${dragOffset.y}}`
            )

            block = {
              id: `block-${nextBlockId}`,
              type: active.data.current.blockType,
              data: blockRegistry[active.data.current.blockType].createNew(),
              position: {
                x: clientX - viewPosition.x - dragOffset.x,
                y: clientY - viewPosition.y - dragOffset.y,
              },
            }
            setNextBlockId(nextBlockId + 1)
          }
        }

        if (!block) return

        setBlocks((prev) => [...prev, block])
      }

      // Reset drag start coordinates
      setDragStartCoordinates(null)
    },
    [blocks, nextBlockId, viewPosition, dragStartCoordinates, blockRegistry]
  )

  // Convert blocks to the format expected by BlocksView
  const blockViewItems = blocks
    .map((block) => {
      const blockElement = blockRegistry[block.type]?.block(
        block.data,
        block.id
      )
      if (!blockElement) return null

      return {
        id: block.id,
        type: block.type,
        data: block.data,
        position: block.position,
        element: blockElement,
      }
    })
    .filter(Boolean) as BlockViewItem[]

  return (
    <SidebarProvider>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Sidebar>
          <SidebarContent>
            <div className="p-4 h-full">{sidebarContent}</div>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <RouteBreadcrumb title={title} />
          <div className="flex-1 p-4 space-y-4">
            {description && <p>{description}</p>}

            <div
              id="canvas-container"
              className="h-[calc(100vh-180px)] border border-gray-200 rounded-md overflow-hidden"
            >
              <BlocksView blocks={blockViewItems} onMove={setViewPosition} />
            </div>
          </div>
        </SidebarInset>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeDragItem &&
            blockRegistry[activeDragItem]?.block(
              blockRegistry[activeDragItem].createNew(),
              "drag-overlay"
            )}
        </DragOverlay>
      </DndContext>
    </SidebarProvider>
  )
}
