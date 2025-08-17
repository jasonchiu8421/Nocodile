import React from "react";
import { DraggableBlock } from "./DraggableBlock";
import { BlockType } from "./blockTypes";
import { GenericBlockData } from "./GenericBlock";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**Block that just stores a bunch of images, for handling state updates see FieldBlock */
export interface ImagesBlockData extends GenericBlockData {
  id: number;
  x: number;
  y: number;
  type: BlockType;

  images: File[];
}
type ImagesBlockProps = {
  block: ImagesBlockData;
  updateBlocks?: (data: ImagesBlockData) => void;
};

export const ImagesBlock = ({ block, updateBlocks }: ImagesBlockProps) => {
  const [files, setFiles] = React.useState<File[]>([]);

  function updateBlock(updatedData: Partial<ImagesBlockData>) {
    /**This is the same with all blocks with data. */
    const updatedBlock = { ...block, ...updatedData }; // the entire block of data.
    updateBlocks?.(updatedBlock); // see page.tsx
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;
    let fileArray: File[] = [];
    if (selectedFiles) {
      fileArray = Array.from(selectedFiles);
      setFiles(fileArray);
    }
    updateBlock?.({ images: fileArray });
  }

  return (
    <DraggableBlock id={block.id} x={block.x} y={block.y}>
      <h1>Images block</h1>
      <small>Type: {block.type}</small>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={"outline"} onClick={() => console.log("click")}>
            {block.images.length} images in set
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Images in set</DialogTitle>
            <DialogDescription>Upload your images here.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* {<div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>} */}
    </DraggableBlock>
  );
};
