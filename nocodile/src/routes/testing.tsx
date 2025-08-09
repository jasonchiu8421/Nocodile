import allBlocks, { saveFunc } from "@/components/blocks/testing_blocks"
import { BlockDrawer } from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import { Toaster } from "@/components/ui/sonner"
import { useBlocksStore } from "@/store"
import { defaultBlocks } from "@/store/useBlocksStore"

export default function Testing() {
  const { testingBlocks, setTestingBlocks } = useBlocksStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Testing Blocks</h2>
      <BlockDrawer blockRegistry={allBlocks} blocks={testingBlocks} className="flex-1" />
    </div>
  );

  return (
    <>
      <DndLayout
        title="Model Testing"
        sidebarContent={sidebarContent}
        blockRegistry={allBlocks}
        blocks={testingBlocks}
        setBlocks={setTestingBlocks}
        defaultBlocks={defaultBlocks}
        save={saveFunc}
      />
      <Toaster />
    </>
  );
}
