import React from "react";
import { useDraggable } from "@dnd-kit/core";

/** Skeleton for all blocks. All blocks have these.*/
type DraggableBlockProps = {
  id: number;
  x: number;
  y: number;
  children: React.ReactNode; // Allow child components to define their own content
};

export const DraggableBlock = ({ id, x, y, children }: DraggableBlockProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    scale: transform ? 1.01 : 1,
    cursor: transform ? "grabbing" : "grab",
    transition: "scale 0.05s ease",
  };

  return (
    <div
      className="block"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={(e) => e.stopPropagation()}
      style={style}
    >
      <span onDrag={(e) => e.stopPropagation()}>{children}</span>
    </div>
  );
};
