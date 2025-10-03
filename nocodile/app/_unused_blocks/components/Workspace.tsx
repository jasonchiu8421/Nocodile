import React from "react";
import { GenericBlock, GenericBlockData } from "./blocks/GenericBlock";
import { FieldBlock } from "./blocks/FieldBlock";
import { ImagesBlock } from "./blocks/ImagesBlock";
import { useDroppable } from "@dnd-kit/core";

/**Displays blocks using block data imported from blocks/ page */
export type WorkspaceData = {
  id: number;
  title: string;
};
type WorkspaceProps = {
  workspace: WorkspaceData;
  blocks: GenericBlockData[];
  onBgDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  updateBlocks?: (data: GenericBlockData) => void; // Passed to blocks with fields
};

export const Workspace = ({
  workspace,
  blocks,
  onBgDoubleClick,
  updateBlocks,
}: WorkspaceProps) => {
  //dnd stuff
  const { setNodeRef } = useDroppable({ id: workspace.id });

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
                updateBlocks={updateBlocks}
              />
            );
          case "images":
            return (
              <ImagesBlock
                key={index}
                block={block}
                updateBlocks={updateBlocks}
              />
            );
          default:
            return <GenericBlock key={index} block={block} />;
        }
      })}
    </div>
  );
};
