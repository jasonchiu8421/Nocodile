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
      <h1>Generic Block</h1>
      <small>Type: Generic</small>
      <div>
        <small>
          Position: x: {block.x}, y: {block.y}
        </small>
      </div>
      <div className="mt-2 p-2 bg-gray-50 rounded border">
        <strong>Data:</strong> {block.data}
      </div>
    </DraggableBlock>
  );
};
