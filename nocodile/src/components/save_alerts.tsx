import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { BlockRegistry } from "@/components/blocks"
import { BlockInstance } from "@/components/dnd_layout"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

type SaveError = {
  type: "error"
  message: string
}
type SaveSuccess = {
  type: "success"
}
type SaveResult = SaveError | SaveSuccess

type BlockChain = BlockInstance[]

export function splitChain(blocks: BlockInstance[]): BlockChain[] {
  const chains: BlockChain[] = [
    ...blocks.filter((block) => !block.input).map((block) => [block]),
  ]
  const remainingBlocks: BlockInstance[] = blocks.filter((block) => block.input)
  let iteration = 0

  while (remainingBlocks.length > 0) {
    for (const chain of chains) {
      const block = remainingBlocks.find(
        (block) => block.input === chain[chain.length - 1].id
      )
      if (block) {
        chain.push(block)
        remainingBlocks.splice(remainingBlocks.indexOf(block), 1)
      }
    }
    if (iteration++ > 1000) {
      throw new Error(
        `Infinite loop detected in splitChain, chains: ${JSON.stringify(
          chains.map((chain) => chain.map((block) => block.id))
        )}, remainingBlocks: ${JSON.stringify(
          remainingBlocks.map((block) => block.id)
        )}`
      )
    }
  }

  return chains
}

export type SaveFunction = {
  save(blockRegistry: BlockRegistry, blocks: BlockInstance[]): SaveResult
  filter(
    filter: (blockRegistry: BlockRegistry, blocks: BlockInstance[]) => boolean
  ): SaveFunction
  then(func: SaveFunction): SaveFunction
}

export const SaveFunction = {
  create(
    func: (blockRegistry: BlockRegistry, blocks: BlockInstance[]) => SaveResult
  ): SaveFunction {
    return {
      save: func,
      filter(
        filter: (blockRegistry: BlockRegistry, blocks: BlockInstance[]) => boolean
      ): SaveFunction {
        const originalFunc = func
        return SaveFunction.create((blockRegistry, blocks) => {
          if (!filter(blockRegistry, blocks)) {
            return { type: "error", message: "Filter condition not met" }
          }
          return originalFunc(blockRegistry, blocks)
        })
      },
      then(nextFunc: SaveFunction): SaveFunction {
        const originalFunc = func
        return SaveFunction.create((blockRegistry, blocks) => {
          const result = originalFunc(blockRegistry, blocks)
          if (result.type === "error") {
            return result
          }
          return nextFunc.save(blockRegistry, blocks)
        })
      },
    }
  },

  success(): SaveFunction {
    return SaveFunction.create(() => ({ type: "success" }))
  },

  error(message: string): SaveFunction {
    return SaveFunction.create(() => ({ type: "error", message }))
  },

  formatPreprocessing(): SaveFunction {
    return SaveFunction.create((_blockRegistry, blocks) => {
      try {
        const importBlock = blocks.find((block) => block.type === "import")
        if (!importBlock) {
          return { type: "error", message: "No import block found" }
        }

        const filterBlocks = blocks.filter((block) =>
          ["resize", "grayscale", "normalize", "shuffling"].includes(block.type)
        )

        const preprocessingData = {
          images: importBlock.data.images || [],
          filters: filterBlocks.map((block) => ({
            type: block.type,
            detail: block.data,
            enabled: block.data.enabled,
          })),
        }

        localStorage.setItem("preprocessingData", JSON.stringify(preprocessingData))
        localStorage.setItem("blockLayout", JSON.stringify(blocks))

        return { type: "success" }
      } catch (error) {
        return {
          type: "error",
          message: `Failed to save: ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    })
  },
}

export function SaveButton({
  blockRegistry,
  blocks,
  save,
}: {
  blockRegistry: BlockRegistry
  blocks: BlockInstance[]
  save: SaveFunction
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const result = save.save(blockRegistry, blocks)
    if (result.type === "error") {
      setError(result.message)
      setOpen(true)
    } else {
      toast.success("Saved successfully")
    }
  }

  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
