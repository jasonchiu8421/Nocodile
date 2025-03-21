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

export type BlockChain = BlockInstance[]

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

export abstract class SaveFunction {
  abstract save(
    blockRegistry: BlockRegistry,
    blocks: BlockInstance[]
  ): SaveResult

  abstract filter(
    filter: (blockRegistry: BlockRegistry, blocks: BlockInstance[]) => boolean
  ): SaveFunction

  abstract then(func: SaveFunction): SaveFunction

  static create(
    func: (blockRegistry: BlockRegistry, blocks: BlockInstance[]) => SaveResult
  ): SaveFunction {
    class SaveFunctionImpl implements SaveFunction {
      save(blockRegistry: BlockRegistry, blocks: BlockInstance[]) {
        return func(blockRegistry, blocks)
      }

      filter(
        filter: (
          blockRegistry: BlockRegistry,
          blocks: BlockInstance[]
        ) => boolean
      ): SaveFunction {
        return SaveFunction.create((blockRegistry, blocks) => {
          if (filter(blockRegistry, blocks)) {
            return this.save(blockRegistry, blocks)
          }
          return { type: "success" }
        })
      }

      then(func: SaveFunction): SaveFunction {
        return SaveFunction.create((blockRegistry, blocks) => {
          const result = this.save(blockRegistry, blocks)
          if (result.type === "error") {
            return { type: "error", message: result.message }
          }
          return func.save(blockRegistry, blocks)
        })
      }
    }
    return new SaveFunctionImpl()
  }

  static success(): SaveFunction {
    return SaveFunction.create(() => ({ type: "success" }))
  }

  static error(message: string): SaveFunction {
    return SaveFunction.create(() => ({ type: "error", message }))
  }

  static requireChainCount(count: number): SaveFunction {
    return SaveFunction.create((_, blocks) => {
      const chains = splitChain(blocks)
      if (count >= 0 && chains.length === 0) {
        return { type: "error", message: `No blocks found!` }
      } else if (count > 0 && chains.length < count) {
        return {
          type: "error",
          message: `At least ${count} block groups are required!`,
        }
      } else if (count < 0 && chains.length > -count) {
        return {
          type: "error",
          message: `At most ${-count} block groups are allowed!`,
        }
      } else if (count === 0 && chains.length !== 0) {
        return { type: "error", message: `No block groups are allowed!` }
      } else if (count === 1 && chains.length > 1) {
        return {
          type: "error",
          message: `You have dangling blocks that are not part of a chain! You should connect them or remove them.`,
        }
      } else if (count >= 1 && chains.length > count) {
        return {
          type: "error",
          message: `At most ${count} block groups are allowed!`,
        }
      }

      return { type: "success" }
    })
  }
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
    console.log("handleSave", result)
    if (result.type === "error") {
      setOpen(true)
      setError(result.message)
    } else {
      toast.success("Saved successfully!")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={handleSave}>
        Save
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Error</AlertDialogTitle>
          <AlertDialogDescription>{error}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
