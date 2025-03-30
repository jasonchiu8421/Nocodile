import { saveFunc } from "@/components/blocks/preprocessing_blocks"
import { allTrainingBlocks } from "@/components/blocks/training_blocks"
import { BlockDrawer } from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import { Toaster } from "@/components/ui/sonner"
import { useBlocksStore } from "@/store"
import { defaultTrainingBlocks } from "@/store/useBlocksStore"

export default function TrainingRoute() {
  const { trainingBlocks, setTrainingBlocks } = useBlocksStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Training Blocks</h2>
      <BlockDrawer blockRegistry={allTrainingBlocks} blocks={trainingBlocks} className="flex-1" />
    </div>
  )

  return (
    <>
      <DndLayout
        title="Model Training"
        sidebarContent={sidebarContent}
        blockRegistry={allTrainingBlocks}
        blocks={trainingBlocks}
        setBlocks={setTrainingBlocks}
        defaultBlocks={defaultTrainingBlocks}
        save={saveFunc}
      />
      <Toaster visibleToasts={10} />
    </>
  )
}
