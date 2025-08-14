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
  return (
    <DraggableBlock id={block.id} x={block.x} y={block.y}>
      <div>
        <input type="file" multiple accept="image/*" />
      </div>
    </DraggableBlock>
  );
};
