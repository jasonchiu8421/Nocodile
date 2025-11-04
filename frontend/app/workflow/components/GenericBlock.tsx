import React from "react";
import { useDraggable } from "@dnd-kit/core";
export interface GenericBlockData {
  id: number;
  x: number;
  y: number;
  title: string;
  label: string;
}
type GenericBlockProps = {
  block: GenericBlockData;
};

export const GenericBlock = ({ block }: GenericBlockProps) => {
  //just dnd stuff
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: block.x,
    top: block.y,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    scale: transform ? 1.01 : 1,
    cursor: transform ? "grabbing" : "grab",
    transition: "scale 0.05s ease",
  };
  return (
    <div
      className="p-4 border w-[200px] m-1 border-black-200 rounded-xl"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseDown={(e) => e.stopPropagation()}
      style={style}
    >
      <h1>{block.title || "Empty title"}</h1>
      <small>
        x: {block.x}, y: {block.y}
      </small>
      <p>{block.label}</p>
    </div>
  );
};
