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
import { Coordinates } from "@dnd-kit/core/dist/types"
import { ReactNode, useCallback, useState } from "react"
import { BlocksView } from "./canvas"
import { ResetBlocksButton } from "./reset_blocks"
import { SaveFunction } from "./save_alerts"

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
  defaultBlocks: () => BlockInstance[]
  save: SaveFunction
}

type ActiveDragItem = {
  id: string | null
  type: string
  data: any
  blockType: string
  origin: "drawer" | "canvas"
  currentPosition: { x: number; y: number } | null
  position:
    | ((delta: { x: number; y: number }) => { x: number; y: number })
    | null
  previewTranslate: { x: number; y: number } | null
  inputSnapTo: string | null
  outputSnapTo: string | null
  bounds: { width: number; height: number } | null
}

function nextBlockId(blocks: BlockInstance[]) {
  return (
    blocks.reduce((maxId, block) => {
      const blockId = parseInt(block.id.replace("block-", ""))
      return Math.max(maxId, blockId)
    }, 0) + 1
  )
}

export function DndLayout({
  title,
  description,
  sidebarContent,
  blockRegistry,
  blocks,
  setBlocks,
  defaultBlocks,
  save,
}: DndLayoutProps) {
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem | null>(
    null
  )
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 })
  const [viewZoom, setViewZoom] = useState(1)

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

      for (const element of connectors) {
        // Skip if not an HTMLElement
        if (!(element instanceof HTMLElement)) continue

        // Get connector data
        const connectorType = element.getAttribute("data-connector-type")
        const connectorId = element.getAttribute("data-connector-id")
        const connectorFilled = element.getAttribute("data-connector-filled")

        // Skip if no connector type or ID or if the connector is already filled
        if (!connectorType || !connectorId || connectorFilled === "true")
          continue

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
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveDragItem(null)

      if (event.active.data.current?.type === "block") {
        if (event.active.data.current?.origin === "drawer") {
          let position: null | ((delta: Coordinates) => Coordinates) = null
          let previewTranslate: { x: number; y: number } | null = null

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

            // Account for zoom in position calculation
            position = (delta: Coordinates) => ({
              x: clientX + delta.x - offsetX,
              y: clientY + delta.y - offsetY,
            })
            previewTranslate = { x: -rect.left, y: -rect.top }
          }

          setActiveDragItem({
            id: null,
            type: "block",
            blockType: event.active.data.current.blockType,
            origin: event.active.data.current.origin,
            currentPosition: position ? position({ x: 0, y: 0 }) : null,
            position,
            previewTranslate,
            inputSnapTo: null,
            outputSnapTo: null,
            bounds: { width: 200, height: 0 },
            data: blockRegistry[event.active.data.current.blockType].createNew(),
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
            previewTranslate: null,
            inputSnapTo: null,
            outputSnapTo: null,
            bounds: { width: rect.width, height: rect.height },
            data: event.active.data.current.data,
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
                input:
                  block.input === event.active.data.current?.blockId
                    ? null
                    : block.input,
                output:
                  block.output === event.active.data.current?.blockId
                    ? null
                    : block.output,
              }
            })
          )
        }
      }
    },
    [blocks, viewZoom]
  )

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
          const position = {
            x:
              ((activeDragItem?.currentPosition?.x ?? 0) -
                rect.x -
                viewPosition.x -
                3) /
              viewZoom,
            y:
              ((activeDragItem?.currentPosition?.y ?? 0) -
                rect.y -
                viewPosition.y -
                3) /
              viewZoom,
          }

          if (active.data.current?.origin === "canvas") {
            addBlock({
              id: active.data.current.blockId,
              type: active.data.current.blockType,
              data: active.data.current.blockData,
              position,
              input: activeDragItem?.inputSnapTo ?? null,
              output: activeDragItem?.outputSnapTo ?? null,
            })
          } else if (active.data.current?.origin === "drawer") {
            addBlock({
              id: `block-${nextBlockId(blocks)}`,
              type: active.data.current.blockType,
              data: blockRegistry[active.data.current.blockType].createNew(),
              position,
              input: activeDragItem?.inputSnapTo ?? null,
              output: activeDragItem?.outputSnapTo ?? null,
            })
          }
        }
      }

      // Reset drag start coordinates
      setActiveDragItem(null)
    },
    [blocks, nextBlockId, viewPosition, viewZoom, blockRegistry]
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
        d => {},
        null
      )
      if (!blockElement) return null

      return {
        ...block,
        visible: block.id !== activeDragItem?.id,
      }
    })
    .filter(Boolean) as BlockViewItem[]

  // This modifier positions the drag overlay at the correct position
  const snapToPosition: Modifier = (args) => {
    if (!activeDragItem?.currentPosition) return args.transform

    // For drag overlay, we need to position it correctly but not scale it here
    // The scaling will be handled by the div's transform style
    return {
      x: activeDragItem.currentPosition.x,
      y: activeDragItem.currentPosition.y,
      scaleX: 1, // Don't scale here, we'll handle it in the div style
      scaleY: 1,
    }
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
          <RouteBreadcrumb title={title}>
            <ResetBlocksButton defaultBlocks={defaultBlocks} setBlocks={setBlocks} />
          </RouteBreadcrumb>
          <div className="flex-1 p-4 space-y-4 flex">
            {description && <p>{description}</p>}

            <div
              id="canvas-container"
              className="flex-1 border border-gray-200 rounded-md overflow-hidden"
            >
              <BlocksView
                blockRegistry={blockRegistry}
                blocks={blockViewItems}
                setBlocks={setBlocks}
                onMove={setViewPosition}
                onZoom={setViewZoom}
              />
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
                pointerEvents: "none",
                transform: `translate(${
                  activeDragItem.previewTranslate?.x || 0
                }px, ${
                  activeDragItem.previewTranslate?.y || 0
                }px) scale(${viewZoom})`,
                transformOrigin: "0 0",
                zIndex: 1000,
              }}
            >
              <BlockIO
                id="drag-overlay"
                type={blockRegistry[activeDragItem.blockType]}
                previewConnections={{
                  input: activeDragItem.inputSnapTo !== null,
                  output: activeDragItem.outputSnapTo !== null,
                }}
              >
                {blockRegistry[activeDragItem.blockType].block(
                  activeDragItem.data ?? blockRegistry[activeDragItem.blockType].createNew(),
                  "drag-overlay",
                  d => {}
                )}
              </BlockIO>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </SidebarProvider>
  )
}
