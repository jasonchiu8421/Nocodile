import React from "react";
import { DraggableBlock } from "./DraggableBlock";
import { BlockType } from "./blockTypes";
import { GenericBlockData } from "./GenericBlock";

/**Block that just stores a bunch of images */
export interface ImagesBlockData extends GenericBlockData {
  id: number;
  x: number;
  y: number;
  type: BlockType;

  images: File[];
}
type ImagesBlockProps = {
  block: ImagesBlockData;
};

export const ImagesBlock = ({ block }: ImagesBlockProps) => {
  const [files, setFiles] = React.useState<File[]>([]);
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles(fileArray);
    }
  }

  return (
    <DraggableBlock id={block.id} x={block.x} y={block.y}>
      <h1>Images block</h1>
      <small>Type: {block.type}</small>
      {files.length > 0 ? (
        <div className="bg-gray-500 p-2 rounded-lg">Add images here...</div>
      ) : (
        <div>files.length+" images"</div>
      )}

      <div>
        <input type="file" multiple accept="image/*" />
      </div>
    </DraggableBlock>
  );
};
