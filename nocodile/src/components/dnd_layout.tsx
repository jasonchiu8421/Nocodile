import { BlockIO, BlockRegistry, BlockViewItem } from "@/components/blocks"
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
import { BlocksView } from "./canvas"
import { Coordinates } from "@dnd-kit/core/dist/types"

export type BlockInstance = {
  id: string
  type: string
  data: any
  position: { x: number; y: number }
  input: string | null
  output: string | null
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
  currentPosition: { x: number; y: number } | null
  position:
    | ((delta: { x: number; y: number }) => { x: number; y: number })
    | null
  inputSnapTo: string | null
  outputSnapTo: string | null
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

  const handleSnapping = useCallback<
    (
      active: DragStartEvent["active"],
      delta: Coordinates
    ) => ActiveDragItem | null
  >(
    (active, delta) => {
      let item: ActiveDragItem | null = activeDragItem
      if (!item) return null

      item = {
        ...item,
        currentPosition: item.position?.(delta) ?? null,
        inputSnapTo: null,
        outputSnapTo: null,
      }

      // Get the active block's ID
      const activeBlockId = active.data.current?.blockId
      if (!activeBlockId && active.data.current?.origin !== "drawer") {
        return item
      }

      const canvasElement = document.getElementById("canvas-container")
      if (!canvasElement) return item

      // Define snap distance threshold (in pixels)
      const snapThreshold = 20

      // Find all connectors except those belonging to the active block
      const connectors = document.querySelectorAll("[data-connector-id]")

      const selfConnectorPosition = {
        x: item.position?.(delta)?.x || 0,
        y: item.position?.(delta)?.y || 0,
      }

      const inputConnectorPosition = blockRegistry[item.blockType].hasInput
        ? {
            x: selfConnectorPosition.x - 16 + 8,
            y: selfConnectorPosition.y + 16 + 16,
          }
        : null
      const outputConnectorPosition = blockRegistry[item.blockType].hasOutput
        ? {
            x: selfConnectorPosition.x + (item.bounds?.width || 0) + 8,
            y: selfConnectorPosition.y + 16 + 16,
          }
        : null

      console.log("try drop", selfConnectorPosition, connectors)

      for (const element of connectors) {
        // Skip if not an HTMLElement
        if (!(element instanceof HTMLElement)) continue

        // Get connector data
        const connectorType = element.getAttribute("data-connector-type")
        const connectorId = element.getAttribute("data-connector-id")

        // Skip if no connector type or ID
        if (!connectorType || !connectorId) continue

        // Skip if this connector belongs to the active block
        const connectorBlockId = connectorId.substring(
          0,
          connectorId.lastIndexOf("/")
        )
        if (connectorBlockId === activeBlockId) continue

        console.log("considering", connectorBlockId)

        const rect = element.getBoundingClientRect()

        if (connectorType === "input" && outputConnectorPosition) {
          const distance = Math.sqrt(
            Math.pow(outputConnectorPosition.x - (rect.x + rect.width / 2), 2) +
              Math.pow(
                outputConnectorPosition.y - (rect.y + rect.height / 2),
                2
              )
          )

          if (distance < snapThreshold) {
            return {
              ...item,
              currentPosition: {
                x: rect.x - (item.bounds?.width || 0),
                y: rect.y - 16,
              },
              outputSnapTo: connectorBlockId,
            } as ActiveDragItem
          }
        } else if (connectorType === "output" && inputConnectorPosition) {
          const distance = Math.sqrt(
            Math.pow(inputConnectorPosition.x - (rect.x + rect.width / 2), 2) +
              Math.pow(inputConnectorPosition.y - (rect.y + rect.height / 2), 2)
          )

          if (distance < snapThreshold) {
            console.log("pog")
            return {
              ...activeDragItem,
              currentPosition: {
                x: rect.x + 16,
                y: rect.y - 16,
              },
              inputSnapTo: connectorBlockId,
            } as ActiveDragItem
          }
        }
      }

      return item
    },
    [activeDragItem]
  )

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragItem(null)

    if (event.active.data.current?.type === "block") {
      if (event.active.data.current?.origin === "drawer") {
        let dragStartCoordinates: { x: number; y: number } | null = null
        let position: null | ((delta: Coordinates) => Coordinates) = null

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

          position = (delta: Coordinates) => ({
            x: clientX + delta.x - (dragStartCoordinates?.x || 0),
            y: clientY + delta.y - (dragStartCoordinates?.y || 0),
          })
        }

        setActiveDragItem({
          id: null,
          type: "block",
          blockType: event.active.data.current.blockType,
          origin: event.active.data.current.origin,
          currentPosition: position ? position({ x: 0, y: 0 }) : null,
          position,
          inputSnapTo: null,
          outputSnapTo: null,
          bounds: { width: 200, height: 0 },
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
          currentPosition: { x: rect.left, y: rect.top },
          position: (delta) => ({
            x: rect.left + delta.x,
            y: rect.top + delta.y,
          }),
          inputSnapTo: null,
          outputSnapTo: null,
          bounds: { width: rect.width, height: rect.height },
          dragStartCoordinates: null,
        })

        setBlocks(
          blocks.map((block) => {
            if (block.id === event.active.data.current?.blockId) {
              return {
                ...block,
                input: null,
                output: null,
              }
            }
            return {
              ...block,
              input: block.input === event.active.data.current?.blockId ? null : block.input,
              output: block.output === event.active.data.current?.blockId ? null : block.output,
            }
          })
        )
      }
    }
  }, [blocks])

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      setActiveDragItem(handleSnapping(event.active, event.delta))
    },
    [handleSnapping]
  )

  const addBlock = (block: BlockInstance) => {
    setBlocks([
      ...blocks
        .filter((b) => b.id !== block.id)
        .map((b) => {
          if (b.id === block.input) {
            return {
              ...b,
              input: b.input === block.id ? null : b.input,
              output: block.id,
            }
          } else if (b.id === block.output) {
            return {
              ...b,
              input: block.id,
              output: b.output === block.id ? null : b.output,
            }
          }

          return {
            ...b,
            input: b.input === block.id ? null : b.input,
            output: b.output === block.id ? null : b.output,
          }
        }),
      block,
    ])
  }

  // Handle drag end from DndContext
  const handleDrop = useCallback(
    (event: DragEndEvent, activeDragItem: ActiveDragItem | null) => {
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
            addBlock({
              id: active.data.current.blockId,
              type: active.data.current.blockType,
              data: active.data.current.blockData,
              position: {
                x:
                  (activeDragItem?.currentPosition?.x ?? 0) -
                  rect.x -
                  viewPosition.x -
                  3,
                y:
                  (activeDragItem?.currentPosition?.y ?? 0) -
                  rect.y -
                  viewPosition.y -
                  3,
              },
              input: activeDragItem?.inputSnapTo ?? null,
              output: activeDragItem?.outputSnapTo ?? null,
            })
          } else if (active.data.current?.origin === "drawer") {
            const offsetClientX = clientX + event.delta.x - rect.left
            const offsetClientY = clientY + event.delta.y - rect.top

            const dragOffset = activeDragItem?.dragStartCoordinates || {
              x: 0,
              y: 0,
            }

            setNextBlockId(nextBlockId + 1)
            addBlock({
              id: `block-${nextBlockId}`,
              type: active.data.current.blockType,
              data: blockRegistry[active.data.current.blockType].createNew(),
              position: {
                x: offsetClientX - viewPosition.x - dragOffset.x,
                y: offsetClientY - viewPosition.y - dragOffset.y,
              },
              input: activeDragItem?.inputSnapTo ?? null,
              output: activeDragItem?.outputSnapTo ?? null,
            })
          }
        }
      }

      // Reset drag start coordinates
      setActiveDragItem(null)
    },
    [blocks, nextBlockId, viewPosition, blockRegistry]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      handleDrop(event, handleSnapping(event.active, event.delta))
    },
    [handleDrop, handleSnapping]
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
        ...block,
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
          <div className="flex-1 p-4 space-y-4 flex">
            {description && <p>{description}</p>}

            <div
              id="canvas-container"
              className="flex-1 border border-gray-200 rounded-md overflow-hidden"
            >
              <BlocksView blockRegistry={blockRegistry} blocks={blockViewItems} onMove={setViewPosition} />
            </div>
          </div>
        </SidebarInset>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null} modifiers={[snapToPosition]}>
          {activeDragItem && blockRegistry[activeDragItem.blockType] && (
            <div
              style={{
                width: `${activeDragItem.bounds?.width}px`,
                height: `${activeDragItem.bounds?.height}px`,
                transform: "none",
                pointerEvents: "none",
                zIndex: 1000,
              }}
            >
              <BlockIO
                id="drag-overlay"
                type={blockRegistry[activeDragItem.blockType]}
              >
                {blockRegistry[activeDragItem.blockType].block(
                  blockRegistry[activeDragItem.blockType].createNew(),
                  "drag-overlay"
                )}
              </BlockIO>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </SidebarProvider>
  )
}
