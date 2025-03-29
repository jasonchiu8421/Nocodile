import { cn } from "@/lib/utils"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { BlockRegistry, BlockType } from "@/components/blocks/blocks"
import { BlockInstance } from "./dnd_layout"
import { Card } from "./ui/card"
import { Separator } from "./ui/separator"

type BlockDrawerProps = {
  blockRegistry: BlockRegistry
  inactiveBlocks: string[]
  className?: string
}

export function calculateInactiveBlocks(
  blockRegistry: BlockRegistry,
  blocks: BlockInstance[]
): string[] {
  return Object.keys(blockRegistry).filter((blockType) => {
    const blockInfo = blockRegistry[blockType]
    const blockCount = blocks.filter((b) => b.type === blockType).length
    return blockInfo.limit && blockCount >= blockInfo.limit
  })
}

export function BlockDrawer({
  blockRegistry,
  inactiveBlocks,
  className,
}: BlockDrawerProps) {
  const { setNodeRef } = useDroppable({
    id: "blocks-drawer",
  })

  return (
    <div ref={setNodeRef} className={cn("space-y-3", className)}>
      {/* Trash zone for deleting blocks */}
      <div className="text-sm space-y-1">
        <div className="font-medium">
          Drag and drop blocks to create your data preprocessing pipeline.
        </div>
        <div className="text-muted-foreground heading-none">
          Drop blocks on this panel to delete them.
        </div>
      </div>

      <Separator className="my-3" />

      {/* Block items */}
      {Object.entries(blockRegistry).filter(([_, info]) => !info.immortal).map(([blockType, blockInfo]) =>
        inactiveBlocks.includes(blockType) ? (
          <DrawerItem key={blockType} blockInfo={blockInfo} active={false} />
        ) : (
          <DraggableDrawerItem
            key={blockType}
            id={`drawer-${blockType}`}
            blockType={blockType}
          >
            <DrawerItem blockInfo={blockInfo} active={true} />
          </DraggableDrawerItem>
        )
      )}
    </div>
  )
}

function DrawerItem({
  blockInfo,
  active,
}: {
  blockInfo: BlockType<any>
  active: boolean
}) {
  return (
    <Card
      className={cn(
        "p-3 hover:shadow-md transition-shadow",
        !active && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center">
        <div className="mr-2">{blockInfo.icon}</div>
        <div className="font-medium">{blockInfo.title}</div>
      </div>
    </Card>
  )
}

function DraggableDrawerItem({
  id,
  blockType,
  children,
}: {
  id: string
  blockType: string
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: { type: "block", origin: "drawer", blockType },
  })

  return (
    <div
      id={`draggable/drawer/${id}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  )
}
