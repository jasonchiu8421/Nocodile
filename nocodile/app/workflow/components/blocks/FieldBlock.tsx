import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { BlockType } from "./blockTypes";
import { GenericBlockData } from "../GenericBlock";
import { DraggableBlock } from "./DraggableBlock";
import { useState } from "react";

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
  onFieldChange?: () => void;
};

export const FieldBlock = ({ block, onFieldChange }: FieldBlockProps) => {
  const [name, setName] = useState("Default Name");
  const [sliderValue, setSliderValue] = useState(0.5);

  function handleChange() {
    if (onFieldChange) {
      onFieldChange();
    }
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
            handleChange();
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
          onChange={(e) => {
            setSliderValue(e.target.valueAsNumber);
            handleChange();
          }}
        />
      </div>
    </DraggableBlock>
  );
};
