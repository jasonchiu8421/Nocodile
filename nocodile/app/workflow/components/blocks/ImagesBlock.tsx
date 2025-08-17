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

const FileCard = ({ file }: { file: File }) => {
  return (
    <div>
      <img src={URL.createObjectURL(file)} alt={file.name} className="w-24" />
    </div>
  );
};
export const ImagesBlock = ({ block, updateBlocks }: ImagesBlockProps) => {
  const [files, setFiles] = React.useState<File[]>([]);

  function updateBlock(updatedData: Partial<ImagesBlockData>) {
    /**This is the same with all blocks with data. */
    const updatedBlock = { ...block, ...updatedData }; // the entire block of data.
    updateBlocks?.(updatedBlock); // see page.tsx
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length === 0) {
      event.target.value = "";
      return;
    }

    // De-duplicate by name+size+lastModified to avoid duplicates when adding
    const dedupe = (arr: File[]) => {
      const map = new Map<string, File>();
      for (const f of arr) {
        map.set(`${f.name}:${f.size}:${f.lastModified}`, f);
      }
      return Array.from(map.values());
    };

    const next = dedupe([...files, ...selected]);
    setFiles(next);
    updateBlock?.({ images: next });

    // Allow picking the same files again in subsequent selections
    event.target.value = "";
  }

  return (
    <DraggableBlock id={block.id} x={block.x} y={block.y}>
      <div onPointerDownCapture={(e) => e.stopPropagation()}>
        <h1>Images block</h1>
        <small>Type: {block.type}</small>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={"outline"} onClick={() => console.log("click")}>
              {block.images.length} images in set
            </Button>
          </DialogTrigger>
          <DialogContent className="min-w-[70vw]">
            <DialogHeader>
              <DialogTitle>Images in set</DialogTitle>
              {/* <DialogDescription>Upload your images here.</DialogDescription> */}
            </DialogHeader>
            <label htmlFor="file">
              <Button onClick={() => document.getElementById("file")?.click()}>
                Add images
              </Button>
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              id="file"
              style={{ display: "none" }}
            />
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <FileCard key={file.name} file={file} />
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DraggableBlock>
  );
};
