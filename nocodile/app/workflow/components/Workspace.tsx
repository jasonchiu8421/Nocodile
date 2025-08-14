import React from "react";
import { GenericBlock, GenericBlockData } from "./GenericBlock";
import { FieldBlock } from "./FieldBlock";
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
};

export const Workspace = ({
  workspace,
  blocks,
  onBgDoubleClick,
}: WorkspaceProps) => {
  //dnd stuff
  const { setNodeRef } = useDroppable({ id: workspace.id });

  //debug, use to show all state chagnes
  function handleFieldChange() {
    console.log(blocks);
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
          case "nothing":
            return <GenericBlock key={index} block={block} />;
          case "input":
            return (
              <FieldBlock
                key={index}
                block={block}
                onFieldChange={handleFieldChange}
              />
            );
          default:
            return <GenericBlock key={index} block={block} />;
        }
      })}
    </div>
  );
};
