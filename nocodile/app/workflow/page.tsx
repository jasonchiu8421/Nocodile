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
  { id: 1, x: 0, y: 0, title: "Test title", label: "Hello!", type: "nothing" },
  {
    id: 2,
    x: 100,
    y: 100,
    title: "Test tity",
    label: "My name is Gustavo!",
    type: "nothing",
  },
  {
    id: 3,
    x: 200,
    y: 200,
    title: "Test tity",
    label: "A field block shouldn't have labels here!",
    type: "input",
  },
];
const page = () => {
  const [blocks, setBlocks] = useState<GenericBlockData[]>(test_blocks);
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    console.log("click");
  }

  function addBlock(e: React.MouseEvent<HTMLDivElement>) {
    // This fires only when clicking the workspace background (blocks stop propagation)
    console.log("add block");

    setBlocks([
      ...blocks,
      {
        id: blocks.length + 1,
        x: e.clientX - 50,
        y: e.clientY - 50,
        title: "New Block",
        label: "New Block",
        type: "nothing",
      },
    ]);
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
  }
  return (
    <main>
      <DndContext onDragEnd={handleDragEnd} onDragMove={handleDragMove}>
        <Workspace
          workspace={test_workspace}
          blocks={blocks}
          onBgDoubleClick={addBlock}
        />
      </DndContext>
    </main>
  );
};

export default page;
