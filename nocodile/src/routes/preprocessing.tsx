import {
  BlockDrawer
} from "@/components/blocks_drawer"
import { DndLayout } from "@/components/dnd_layout"
import allBlocks from "@/components/preprocessing_blocks"
import { SaveFunction, splitChain } from "@/components/save_alerts"
import { Toaster } from "@/components/ui/sonner"
import { useBlocksStore } from "@/store"
import { defaultBlocks } from "@/store/useBlocksStore"
import { useEffect } from "react"

export default function Preprocessing() {
  const { preprocessingBlocks, setPreprocessingBlocks, inactivePreprocessingBlocks } = useBlocksStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      <BlockDrawer
        blockRegistry={allBlocks}
        inactiveBlocks={inactivePreprocessingBlocks}
        className="flex-1"
      />
    </div>
  )

  const saveFunc = SaveFunction.requireChainCount(1).then(
    SaveFunction.create((_, blocks) => {
      const chain = splitChain(blocks)
      if (chain[0][0].type !== "start") {
        return {
          type: "error",
          message: "The first block must be a start block!",
        }
      } else if (chain[0][chain[0].length - 1].type !== "end") {
        return {
          type: "error",
          message: "The last block must be an end block!",
        }
      }

      return { type: "success" }
    })
  )

  useEffect(() => {
    console.log(JSON.stringify(preprocessingBlocks))
  }, [preprocessingBlocks])

  return (
    <>
      <DndLayout
        title="Data Preprocessing"
        sidebarContent={sidebarContent}
        blockRegistry={allBlocks}
        blocks={preprocessingBlocks}
        setBlocks={setPreprocessingBlocks}
        save={saveFunc}
        defaultBlocks={defaultBlocks}
      />
      <Toaster />
    </>
  )
}
