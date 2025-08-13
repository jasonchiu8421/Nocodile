import React from "react";
import { GenericBlock, GenericBlockData } from "./GenericBlock";
import { useDroppable } from "@dnd-kit/core";

export type WorkspaceData = {
  id: number;
  title: string;
};
type WorkspaceProps = {
  workspace: WorkspaceData;
  blocks: GenericBlockData[];
  onBackgroundMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export const Workspace = ({ workspace, blocks, onBackgroundMouseDown }: WorkspaceProps) => {
  //dnd stuff
  const { setNodeRef } = useDroppable({ id: workspace.id });
  return (
    <div
      ref={setNodeRef}
      className="relative border min-h-screen border-black-200 shadow-inner rounded-md p-2"
      onMouseDown={onBackgroundMouseDown}
    >
      <h2>{workspace.title}</h2>
      {blocks.map((block, index) => {
        return <GenericBlock key={index} block={block} />;
      })}
    </div>
  );
};
