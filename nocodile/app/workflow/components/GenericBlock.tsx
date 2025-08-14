import React from "react";
import { DraggableBlock } from "./DraggableBlock";
import { BlockType } from "./blockTypes";

export interface GenericBlockData {
  id: number;
  x: number;
  y: number;
  title: string;
  label: string;
  type: BlockType;
}
type GenericBlockProps = {
  block: GenericBlockData;
};

export const GenericBlock = ({ block }: GenericBlockProps) => {
  return (
    <DraggableBlock id={block.id} x={block.x} y={block.y}>
      <h1>{block.title || "Empty title"}</h1>
      <p>
        <small>
          x: {block.x}, y: {block.y}
        </small>
      </p>
      <p>
        <small>type: {block.type} </small>
      </p>
      <p>{block.label}</p>
    </DraggableBlock>
  );
};
