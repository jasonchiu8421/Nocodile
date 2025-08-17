"use client";

import React from "react";
import { GenericBlockData } from "./components/blocks/GenericBlock";
import { useState } from "react";
import { WorkspaceData, Workspace } from "./components/Workspace";
import { DndContext, DragEndEvent, DragMoveEvent } from "@dnd-kit/core";

let clickedOnBlock = false;

const test_workspace: WorkspaceData = {
  id: 1,
  title: "Test workspace",
};
const test_blocks: GenericBlockData[] = [
  {
    id: 1,
    x: 0,
    y: 0,
    type: "generic",
    data: "I'm a sheep",
  },
  {
    id: 2,
    x: 100,
    y: 100,
    type: "generic",
    data: "Beep beep",
  },
  {
    id: 3,
    x: 200,
    y: 200,
    type: "field",

    name: "Custom name Owo",
    sliderValue: 0.5,
  },
  {
    id: 4,
    x: 300,
    y: 300,
    type: "images",
    images: [],
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
        type: "generic",
        data: "blahblah random data this can be changed for other stuff",
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

  React.useEffect(() => {
    console.log("Blocks updated:", blocks);
  }, [blocks]);

  function updateBlocks(updatedBlock: GenericBlockData) {
    /**@param updatedBlock Data of the block that's changed */
    // linear search for the changed block using id

    //states are async, can't see log right away
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        return block.id === updatedBlock.id ? updatedBlock : block;
      })
    );
  }
  return (
    <main>
      <DndContext onDragEnd={handleDragEnd} onDragMove={handleDragMove}>
        <Workspace
          workspace={test_workspace}
          blocks={blocks}
          onBgDoubleClick={addBlock}
          updateBlocks={updateBlocks}
        />
      </DndContext>
    </main>
  );
};

export default page;
