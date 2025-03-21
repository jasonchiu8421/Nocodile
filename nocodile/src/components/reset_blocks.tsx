import { RotateCcw } from "lucide-react"
import { BlockInstance } from "./dnd_layout"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import { Button } from "./ui/button"

interface ResetBlocksButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  defaultBlocks: () => BlockInstance[]
  setBlocks: (blocks: BlockInstance[]) => void
}

export function ResetBlocksButton({ variant = "outline", size = "default", className = "", defaultBlocks, setBlocks }: ResetBlocksButtonProps) {
  const handleReset = () => {
    // Reset blocks to default state
    setBlocks(defaultBlocks())
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <RotateCcw className="h-4 w-4" />
          Reset Blocks
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Blocks</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to reset all blocks to their default state? This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
