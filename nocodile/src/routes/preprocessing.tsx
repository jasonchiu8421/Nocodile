import { BlockDrawer } from "@/components/blocks_drawer"
import { BlockInstance, DndLayout } from "@/components/dnd_layout"
import allBlocks from "@/components/preprocessing_blocks"
import { useEffect, useState } from "react"

export default function Preprocessing() {
  const [blocks, setBlocks] = useState<BlockInstance[]>([])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      <BlockDrawer blockRegistry={allBlocks} className="flex-1" />
    </div>
  )

  useEffect(() => {
    console.log(JSON.stringify(blocks))
  }, [blocks])

  return (
    <DndLayout
      title="Data Preprocessing"
      description="Drag and drop blocks from the left panel to create your data preprocessing pipeline."
      sidebarContent={sidebarContent}
      blockRegistry={allBlocks}
      blocks={blocks}
      setBlocks={setBlocks}
    />
  )
}
