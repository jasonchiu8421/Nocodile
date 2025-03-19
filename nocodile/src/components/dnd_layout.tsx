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
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
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
  blocks: BlockInstance[]
  setBlocks: (blocks: BlockInstance[]) => void
}

type ActiveDragItem = {
  id: string | null
  type: string
  blockType: string
  origin: "drawer" | "canvas"
  originalPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
  position:
    | ((delta: { x: number; y: number }) => { x: number; y: number })
    | null
  bounds: { width: number; height: number } | null
  dragStartCoordinates: { x: number; y: number } | null
}

export function DndLayout({
  title,
  description,
  sidebarContent,
  blockRegistry,
  blocks,
  setBlocks,
}: DndLayoutProps) {
  const [nextBlockId, setNextBlockId] = useState(1)
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem | null>(
    null
  )
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 })

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragItem(null)

    if (event.active.data.current?.type === "block") {
      if (event.active.data.current?.origin === "drawer") {
        let dragStartCoordinates: { x: number; y: number } | null = null

        if (
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

          dragStartCoordinates = { x: offsetX, y: offsetY }
        }

        setActiveDragItem({
          id: null,
          type: "block",
          blockType: event.active.data.current.blockType,
          origin: event.active.data.current.origin,
          originalPosition: null,
          currentPosition: null,
          position: null,
          bounds: null,
          dragStartCoordinates,
        })
      } else if (event.active.data.current?.origin === "canvas") {
        const element = document.getElementById(
          `draggable/block/${event.active.id}`
        )
        if (!element) return

        const rect = element.getBoundingClientRect()

        setActiveDragItem({
          id: event.active.data.current.blockId,
          type: "block",
          blockType: event.active.data.current.blockType,
          origin: event.active.data.current.origin,
          originalPosition: { x: rect.left, y: rect.top },
          currentPosition: { x: rect.left, y: rect.top },
          position: (delta) => ({
            x: rect.left + delta.x,
            y: rect.top + delta.y,
          }),
          bounds: { width: rect.width, height: rect.height },
          dragStartCoordinates: null,
        })
      }
    }
  }, [])

  // Handle drag move for snapping
  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!activeDragItem) return

      setActiveDragItem({
        ...activeDragItem,
        currentPosition: activeDragItem.position?.(event.delta) ?? null,
      })

      // Get the active block's ID
      const activeBlockId = event.active.data.current?.blockId
      if (!activeBlockId && event.active.data.current?.origin !== "drawer") {
        return
      }

      const canvasElement = document.getElementById("canvas-container")
      if (!canvasElement) return

      // Define snap distance threshold (in pixels)
      const snapThreshold = 20
      let closestDistance = snapThreshold

      // Find all connectors except those belonging to the active block
      const connectors = document.querySelectorAll("[data-connector-id]")

      const selfConnectorPosition = {
        x: activeDragItem.position?.(event.delta)?.x || 0,
        y: activeDragItem.position?.(event.delta)?.y || 0,
      }

      const inputConnectorPosition = blockRegistry[activeDragItem.blockType]
        .hasInput
        ? {
            x: selfConnectorPosition.x - 16 + 8,
            y: selfConnectorPosition.y + 16 + 16,
          }
        : null
      const outputConnectorPosition = blockRegistry[activeDragItem.blockType]
        .hasOutput
        ? {
            x:
              selfConnectorPosition.x + (activeDragItem.bounds?.width || 0) + 8,
            y: selfConnectorPosition.y + 16 + 16,
          }
        : null

      for (const element of connectors) {
        // Skip if not an HTMLElement
        if (!(element instanceof HTMLElement)) continue

        // Get connector data
        const connectorType = element.getAttribute("data-connector-type")
        const connectorId = element.getAttribute("data-connector-id")

        // Skip if no connector type or ID
        if (!connectorType || !connectorId) continue

        // Skip if this connector belongs to the active block
        const connectorBlockId = connectorId.split("-")[0]
        if (connectorBlockId === activeBlockId) continue

        const rect = element.getBoundingClientRect()

        if (connectorType === "input" && outputConnectorPosition) {
          const distance = Math.sqrt(
            Math.pow(outputConnectorPosition.x - (rect.x + rect.width / 2), 2) +
              Math.pow(
                outputConnectorPosition.y - (rect.y + rect.height / 2),
                2
              )
          )

          if (distance < closestDistance) {
            setActiveDragItem({
              ...activeDragItem,
              currentPosition: {
                x: rect.x - (activeDragItem.bounds?.width || 0),
                y: rect.y - 16,
              },
            })
            return
          }
        } else if (connectorType === "output" && inputConnectorPosition) {
          const distance = Math.sqrt(
            Math.pow(inputConnectorPosition.x - (rect.x + rect.width / 2), 2) +
              Math.pow(inputConnectorPosition.y - (rect.y + rect.height / 2), 2)
          )

          if (distance < closestDistance) {
            setActiveDragItem({
              ...activeDragItem,
              currentPosition: {
                x: rect.x + 16,
                y: rect.y - 16,
              },
            })
            return
          }
        }
      }
    },
    [activeDragItem]
  )

  // Handle drag end from DndContext
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, activatorEvent } = event

      const canvasElement = document.getElementById("canvas-container")
      if (!canvasElement) return

      if (!("clientX" in activatorEvent) || !("clientY" in activatorEvent))
        return
      const { clientX, clientY } = activatorEvent as MouseEvent
      const rect = canvasElement.getBoundingClientRect()

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
      if (
        clientX + event.delta.x >= rect.left &&
        clientX + event.delta.x <= rect.right &&
        clientY + event.delta.y >= rect.top &&
        clientY + event.delta.y <= rect.bottom
      ) {
        if (active.data.current?.type === "block") {
          if (active.data.current?.origin === "canvas") {
            const block = {
              id: active.data.current.blockId,
              type: active.data.current.blockType,
              data: active.data.current.blockData,
              position: {
                x:
                  (activeDragItem?.currentPosition?.x ?? 0) -
                  rect.x -
                  viewPosition.x -
                  1,
                y:
                  (activeDragItem?.currentPosition?.y ?? 0) -
                  rect.y -
                  viewPosition.y -
                  1,
              },
            }
            setBlocks([
              ...blocks.filter((b) => b.id !== active.data.current?.blockId),
              block,
            ])
          } else if (active.data.current?.origin === "drawer") {
            const offsetClientX = clientX + event.delta.x - rect.left
            const offsetClientY = clientY + event.delta.y - rect.top

            const dragOffset = activeDragItem?.dragStartCoordinates || {
              x: 0,
              y: 0,
            }

            const block = {
              id: `block-${nextBlockId}`,
              type: active.data.current.blockType,
              data: blockRegistry[active.data.current.blockType].createNew(),
              position: {
                x: offsetClientX - viewPosition.x - dragOffset.x,
                y: offsetClientY - viewPosition.y - dragOffset.y,
              },
            }
            setNextBlockId(nextBlockId + 1)
            setBlocks([...blocks, block])
          }
        }
      }

      // Reset drag start coordinates
      setActiveDragItem(null)
    },
    [blocks, nextBlockId, viewPosition, activeDragItem, blockRegistry]
  )

  // Convert blocks to the format expected by BlocksView
  const blockViewItems = blocks
    .map((block) => {
      const blockElement = blockRegistry[block.type]?.block(
        block.data,
        block.id,
        null
      )
      if (!blockElement) return null

      return {
        id: block.id,
        type: block.type,
        data: block.data,
        position: block.position,
        element: (props: any) =>
          blockRegistry[block.type]?.block(block.data, block.id, props),
        visible: block.id !== activeDragItem?.id,
      }
    })
    .filter(Boolean) as BlockViewItem[]

  const snapToPosition: Modifier = (args) => {
    return activeDragItem?.currentPosition
      ? {
          x: activeDragItem.currentPosition.x,
          y: activeDragItem.currentPosition.y,
          scaleX: 1,
          scaleY: 1,
        }
      : args.transform
  }

  return (
    <SidebarProvider>
      <DndContext
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
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
        <DragOverlay dropAnimation={null} modifiers={[snapToPosition]}>
          {activeDragItem && (
            <div
              style={{
                width: `${activeDragItem.bounds?.width}px`,
                height: `${activeDragItem.bounds?.height}px`,
                transform: "none",
                pointerEvents: "none",
                zIndex: 1000,
              }}
            >
              {blockRegistry[activeDragItem?.blockType]?.block(
                blockRegistry[activeDragItem?.blockType].createNew(),
                "drag-overlay"
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </SidebarProvider>
  )
}
