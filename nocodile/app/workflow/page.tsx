"use client";

import React from "react";
import { GenericBlockData } from "./components/GenericBlock";
import { useState } from "react";
import { WorkspaceData, Workspace } from "./components/Workspace";
import { DndContext, DragEndEvent, DragMoveEvent } from "@dnd-kit/core";

let clickedOnBlock = false;

const test_workspace: WorkspaceData = {
  id: 1,
  title: "Test workspace",
};
const test_blocks: GenericBlockData[] = [
  { id: 1, x: 0, y: 0, title: "Test title", label: "Hello!" },
  { id: 2, x: 100, y: 100, title: "Test tity", label: "My name is Gustavo!" },
];
const page = () => {
  const [blocks, setBlocks] = useState<GenericBlockData[]>(test_blocks);
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    console.log("click");
  }
  function handleBackgroundMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    // This fires only when clicking the workspace background (blocks stop propagation)
    console.log("Background clicked");
    // TODO: clear selection, start marquee, etc.
  }
  function handleDragEnd(e: DragEndEvent) {
    const { active, delta } = e;
    setBlocks(
      (
        prev //pass prev state of the blocks array into func
      ) =>
        prev.map((b) =>
          b.id === (active.id as number)
            ? {
                ...b,
                x: Math.round(b.x + delta.x),
                y: Math.round(b.y + delta.y), //update coords
              }
            : b
        )
    );
  }
  function handleDragMove(e: DragMoveEvent) {
    const { active, over } = e;
    //console.log(active, over);
  }
  return (
    <main>
      <DndContext onDragEnd={handleDragEnd} onDragMove={handleDragMove}>
        <Workspace
          workspace={test_workspace}
          blocks={blocks}
          onBackgroundMouseDown={handleBackgroundMouseDown}
        />
      </DndContext>
    </main>
  );
};

export default page;
