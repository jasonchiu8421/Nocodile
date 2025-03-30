import allPdBlocks, { saveFunc } from "@/components/blocks/predicting_blocks"
import { BlockDrawer } from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import { Toaster } from "@/components/ui/sonner"
import { useBlocksStore } from "@/store"
import { defaultPredictingBlocks } from "@/store/useBlocksStore"

export default function Predicting() {
  const { predictingBlocks, setPredictingBlocks } = useBlocksStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      <BlockDrawer blockRegistry={allPdBlocks} blocks={predictingBlocks} className="flex-1" />
    </div>
  )

  return (
    <>
      <DndLayout 
      title="Predicting" 
      sidebarContent={sidebarContent} 
      blockRegistry={allPdBlocks} 
      blocks={predictingBlocks} 
      setBlocks={setPredictingBlocks} 
      save={saveFunc} 
      defaultBlocks={defaultPredictingBlocks} 
      />
      <Toaster visibleToasts={10}/>
    </>
  )
}
