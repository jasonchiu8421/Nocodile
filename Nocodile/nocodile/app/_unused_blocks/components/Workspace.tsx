import React from "react";
import { GenericBlock, GenericBlockData } from "./blocks/GenericBlock";
import { FieldBlock, FieldBlockData } from "./blocks/FieldBlock";
import { ImagesBlock, ImagesBlockData } from "./blocks/ImagesBlock";
import { useDroppable } from "@dnd-kit/core";

/**Displays blocks using block data imported from blocks/ page */
export type WorkspaceData = {
  id: number;
  title: string;
};
type WorkspaceProps = {
  workspace: WorkspaceData;
  blocks: (GenericBlockData | ImagesBlockData | FieldBlockData)[];
  onBgDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  updateBlocks?: (data: GenericBlockData | ImagesBlockData | FieldBlockData) => void; // Passed to blocks with fields
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
      className="relative border min-h-screen border-gray-200 shadow-inner rounded-md p-4 bg-gray-50"
      onDoubleClick={onBgDoubleClick}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{workspace.title}</h2>
        <p className="text-sm text-gray-500">Double-click to add a new block</p>
      </div>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "generic":
            return <GenericBlock key={index} block={block} />;
          case "field":
            return (
              <FieldBlock
                key={index}
                block={block as FieldBlockData}
                updateBlocks={updateBlocks as (data: FieldBlockData) => void}
              />
            );
          case "images":
            return (
              <ImagesBlock
                key={index}
                block={block as ImagesBlockData}
                updateBlocks={updateBlocks as (data: ImagesBlockData) => void}
              />
            );
          default:
            return <GenericBlock key={index} block={block} />;
        }
      })}
    </div>
  );
};
