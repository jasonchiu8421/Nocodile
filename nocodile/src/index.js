/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly";
import { pythonGenerator } from "blockly/python";
import { save, load } from "./serialization";
import { toolbox } from "./toolbox";

import "./render/customRenderer";

import "./index.css";
import "./blocks/ppBlocks";
import "./blocks/dtBlocks";
import "./blocks/mdBlocks";
import "./generators/python";
import { train as train_api } from "./services/train";

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById("generatedCode").firstChild;
const outputDiv = document.getElementById("output");
const blocklyDiv = document.getElementById("blocklyDiv");
const ws = Blockly.inject(blocklyDiv, {
  options: {
    zoom: {
      controls: true,
      wheel: true,
      startScale: 3,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
    },
  },
  toolbox: toolbox,
  renderer: "customRenderer",
});

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  const code = pythonGenerator.workspaceToCode(ws);
  codeDiv.innerText = code;

  const images = ws.getBlocksByType("configDataset").flatMap((block) => {
    return JSON.parse(block.getFieldValue("dsFiles"));
  }).reduce((acc, file) => {
    acc[file.name] = file.url;
    return acc;
  }, {});
  outputDiv.innerHTML = "<pre></pre><button>Train</button>";
  const button = outputDiv.querySelector("button");
  button.onclick = async function () {
    try {
      const response = await train_api(images, code);
      console.log(response);
    } catch (e) {
      const pre = outputDiv.querySelector("pre");
      pre.innerText = e;
      return;
    }

    const pre = outputDiv.querySelector("pre");
    pre.innerText = "Training successful!";
  };
  outputDiv.appendChild(button);

  //eval(code);
};

// Load the initial state from storage and run the code.
load(ws);
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  runCode();
});
