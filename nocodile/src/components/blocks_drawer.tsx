import { cn } from "@/lib/utils"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { BlockRegistry } from "./blocks"
import { Card } from "./ui/card"
import { Separator } from "./ui/separator"

type BlockDrawerProps = {
  blockRegistry: BlockRegistry
  className?: string
}

export function BlockDrawer({ blockRegistry, className }: BlockDrawerProps) {
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
      {Object.entries(blockRegistry).map(([blockType, blockInfo]) => (
        <DraggableDrawerItem
          key={blockType}
          id={`drawer-${blockType}`}
          blockType={blockType}
        >
          <Card className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="mr-2">{blockInfo.icon}</div>
              <div className="font-medium">{blockInfo.title}</div>
            </div>
          </Card>
        </DraggableDrawerItem>
      ))}
    </div>
  )
}

export function DraggableDrawerItem({
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
