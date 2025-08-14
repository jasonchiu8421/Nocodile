import React from "react";
import { GenericBlock, GenericBlockData } from "./blocks/GenericBlock";
import { FieldBlock } from "./blocks/FieldBlock";
import { ImagesBlock } from "./blocks/ImagesBlock";
import { useDroppable } from "@dnd-kit/core";

/**Displays blocks using block data imported from workflow/ page */
export type WorkspaceData = {
  id: number;
  title: string;
};
type WorkspaceProps = {
  workspace: WorkspaceData;
  blocks: GenericBlockData[];
  onBgDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onBlockChange?: (data: GenericBlockData) => void; // Passed to blocks with fields
};

export const Workspace = ({
  workspace,
  blocks,
  onBgDoubleClick,
  onBlockChange,
}: WorkspaceProps) => {
  //dnd stuff
  const { setNodeRef } = useDroppable({ id: workspace.id });

  //debug, use to show all state chagnes
  function handleBlockChange(data: GenericBlockData) {
    onBlockChange?.(data);
  }

  return (
    <div
      ref={setNodeRef}
      className="relative border min-h-screen border-black-200 shadow-inner rounded-md p-2"
      onDoubleClick={onBgDoubleClick}
    >
      <h2>{workspace.title}</h2>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "generic":
            return <GenericBlock key={index} block={block} />;
          case "field":
            return (
              <FieldBlock
                key={index}
                block={block}
                onBlockChange={handleBlockChange}
              />
            );
          case "images":
            return <ImagesBlock key={index} block={block} />;
          default:
            return <GenericBlock key={index} block={block} />;
        }
      })}
    </div>
  );
};
