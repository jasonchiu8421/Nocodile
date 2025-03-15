import { BlockRegistry } from "./blocks"
import { Card } from "./ui/card"
import { useDraggable } from "@dnd-kit/core"

type BlockDrawerProps = {
  blockRegistry: BlockRegistry
}

export function BlockDrawer({ blockRegistry }: BlockDrawerProps) {
  return (
    <div className="space-y-3">
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
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  )
}
