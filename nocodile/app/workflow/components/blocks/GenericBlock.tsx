import React from "react";
import { DraggableBlock } from "./DraggableBlock";
import { BlockType } from "./blockTypes";

/**The most boring block. Carries data. */
export interface GenericBlockData {
  id: number;
  x: number;
  y: number;
  type: BlockType;

  data: string;
}
type GenericBlockProps = {
  block: GenericBlockData;
};

export const GenericBlock = ({ block }: GenericBlockProps) => {
  return (
    <DraggableBlock id={block.id} x={block.x} y={block.y}>
      <h1>Generic block</h1>
      <div>
        <small>
          x: {block.x}, y: {block.y}
        </small>
      </div>
      <div>
        <small>type: {block.type} </small>
      </div>
      <div>{block.data}</div>
    </DraggableBlock>
  );
};
