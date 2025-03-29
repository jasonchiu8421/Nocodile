import { BlockDrawer } from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import allPerformanceBlocks, { saveFunc } from "@/components/blocks/performance_blocks"
import { Toaster } from "@/components/ui/sonner"
import { useBlocksStore } from "@/store"
import { defaultPerformanceBlocks } from "@/store/useBlocksStore"

export default function Performance() {
  const { performanceBlocks, setPerformanceBlocks, inactivePerformanceBlocks } = useBlocksStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      <BlockDrawer blockRegistry={allPerformanceBlocks} inactiveBlocks={inactivePerformanceBlocks} className="flex-1" />
    </div>
  )

  return (
    <>
      <DndLayout 
      title="Model Performance" 
      sidebarContent={sidebarContent} 
      blockRegistry={allPerformanceBlocks} 
      blocks={performanceBlocks} 
      setBlocks={setPerformanceBlocks} 
      save={saveFunc} 
      defaultBlocks={defaultPerformanceBlocks} 
      />
      <Toaster visibleToasts={10}/>
    </>
  )
}
