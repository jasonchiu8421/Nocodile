import { BlockDrawer } from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import allPpBlocks, { saveFunc } from "@/components/blocks/preprocessing_blocks"
import { Toaster } from "@/components/ui/sonner"
import { useBlocksStore } from "@/store"
import { defaultPreprocessingBlocks } from "@/store/useBlocksStore"

export default function Preprocessing() {
  const { preprocessingBlocks, setPreprocessingBlocks, inactivePreprocessingBlocks } = useBlocksStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      <BlockDrawer blockRegistry={allPpBlocks} inactiveBlocks={inactivePreprocessingBlocks} className="flex-1" />
    </div>
  )

  return (
    <>
      <DndLayout 
      title="Data Preprocessing" 
      sidebarContent={sidebarContent} 
      blockRegistry={allPpBlocks} 
      blocks={preprocessingBlocks} 
      setBlocks={setPreprocessingBlocks} 
      save={saveFunc} 
      defaultBlocks={defaultPreprocessingBlocks} 
      />
      <Toaster visibleToasts={10}/>
    </>
  )
}
