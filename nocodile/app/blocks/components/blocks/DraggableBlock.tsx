import React from "react";
import { useDraggable } from "@dnd-kit/core";

/** Skeleton for all blocks. All blocks have these. Children are immune to drag.*/
type DraggableBlockProps = {
  id: number;
  x: number;
  y: number;
  children: React.ReactNode;
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
      onPointerDownCapture={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("[data-no-drag]")) {
          e.stopPropagation();
        }
      }}
    >
      <span data-no-drag>{children}</span>
    </div>
  );
};
