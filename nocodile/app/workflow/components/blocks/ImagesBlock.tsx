import React from "react";
import { DraggableBlock } from "./DraggableBlock";
import { BlockType } from "./blockTypes";
import { GenericBlockData } from "./GenericBlock";

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
      {files.length == 0 ? (
        <div className="bg-gray-500 p-2 rounded-lg">Add images here...</div>
      ) : (
        <div>{files.length} images</div>
      )}

      <div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </DraggableBlock>
  );
};
