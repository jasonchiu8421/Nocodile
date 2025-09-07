import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { BlockType } from "./blockTypes";
import { GenericBlockData } from "./GenericBlock";
import { DraggableBlock } from "./DraggableBlock";
import { useState } from "react";

/** A block that stores editable fields. Updates the blocks states in blocks/page.tsx */
/**Kinda repeatey but my brain doesnt have eough credits for that */
export interface FieldBlockData extends GenericBlockData {
  id: number;
  x: number;
  y: number;
  type: BlockType;

  name?: string;
  sliderValue?: number;
}

type FieldBlockProps = {
  block: FieldBlockData;
  updateBlocks?: (data: FieldBlockData) => void; // Passed from page
};

export const FieldBlock = ({ block, updateBlocks }: FieldBlockProps) => {
  const [name, setName] = useState(block.name || "Default Name");
  const [sliderValue, setSliderValue] = useState(block.sliderValue || 0.5);

  function updateBlock(updatedData: Partial<FieldBlockData>) {
    const updatedBlock = { ...block, ...updatedData }; //YYou can just do that.... but it'sjust for objects
    //javascripte black magic damn
    updateBlocks?.(updatedBlock);
  }

  return (
    <DraggableBlock id={block.id} x={block.x} y={block.y}>
      <h1>Field Block</h1>
      <small>Type: Field</small>
      <div>
        <label htmlFor="nuber">Name:</label>{" "}
        <input
          id="nuber"
          type="text"
          onChange={(e) => {
            setName(e.target.value);
            updateBlock({ name: e.target.value });
          }}
          value={name}
        />
      </div>
      <div>
        <label>Slider: </label>{" "}
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={sliderValue}
          onChange={(e) => {
            setSliderValue(e.target.valueAsNumber);
            updateBlock({ sliderValue: e.target.valueAsNumber });
          }}
        />
      </div>
    </DraggableBlock>
  );
};
