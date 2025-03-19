import { BlockDrawer } from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import allBlocks from "@/components/preprocessing_blocks"

export default function Preprocessing() {
  // Sidebar content with blocks drawer
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      <BlockDrawer blockRegistry={allBlocks} className="flex-1" />
    </div>
  )

  return (
    <DndLayout
      title="Data Preprocessing"
      description="Drag and drop blocks from the left panel to create your data preprocessing pipeline."
      sidebarContent={sidebarContent}
      blockRegistry={allBlocks}
    />
  )
}
