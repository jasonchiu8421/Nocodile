/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { pythonGenerator } from "blockly/python";
import { Order } from "blockly/javascript";

// Export all the code generators for our custom blocks,
// but don't register them with Blockly yet.
// This file has no side effects!
export const forBlock = Object.create(null);

// DATA BLOCKS
pythonGenerator.forBlock["configDataset"] = function (block, generator) {
  const text_dsname = block.getFieldValue("dsName");

  const text_dsgroup = block.getFieldValue("dsGroup");
  //console.log(block);
  const files_dataset = block.getFieldValue("dsFiles");
  const files = JSON.parse(files_dataset);

  // TODO: Assemble python into the code variable.
  const code = `data.add(${text_dsgroup}, files = [${files.map((e) => `"${e.name.replace(/"/g, '\\"')}"`)}])`;
  return code;
};

pythonGenerator.forBlock["configDoodle"] = function (block, generator) {
  const text_doodleimg = block.getFieldValue("doodleImg");

  const text_pencilbtn = block.getFieldValue("pencilBtn");
  const text_clearbtn = block.getFieldValue("clearBtn");

  // TODO: Assemble python into the code variable.
  const code = `data.add(type=doodle,data=${text_doodleimg}`;
  // TODO: Change Order.NONE to the correct operator precedence strength
  return [code, Order.NONE];
};
/*
pythonGenerator.forBlock["fileInputTest"] = function (block, generator) {
  const text_doodleimg = block.getFieldValue("doodleImg");

  const text_pencilbtn = block.getFieldValue("pencilBtn");
  const text_clearbtn = block.getFieldValue("clearBtn");

  // TODO: Assemble python into the code variable.
  const code = `data.add(type=doodle,data=${text_doodleimg}`;
  // TODO: Change Order.NONE to the correct operator precedence strength
  return [code, Order.NONE];
};*/

// PREPROCESSING BLOCKS
pythonGenerator.forBlock["configPreprocessing"] = function (block, generator) {
  const statement_filters = generator.statementToCode(block, "filters");
  const procedures = statement_filters
    .split("\n")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  // TODO: Assemble python into the code variable.
  const code = `preprocessor.config = [${
    procedures.length > 1 ? "\n" : ""
  }${procedures.join(",\n")}${procedures.length > 1 ? "\n" : ""}]`;
  //console.log("yayayayayay");
  return code;
};

pythonGenerator.forBlock["addResize"] = function (block, generator) {
  const number_resizew = block.getFieldValue("resizeW");
  const number_resizeh = block.getFieldValue("resizeH");

  const dropdown_resizeoption = block.getFieldValue("resizeOption");

  const checkbox_enabled = block.getFieldValue("enabled");

  // TODO: Assemble python into the code variable.
  const code = `resize(${number_resizew}, ${number_resizeh}, ${dropdown_resizeoption}, ${checkbox_enabled})\n`;
  return code;
};
pythonGenerator.forBlock["addGrayscale"] = function (block, generator) {
  const checkbox_name = block.getFieldValue("NAME");

  // TODO: Assemble python into the code variable.
  const code = `grayscale(${checkbox_name})\n`;
  return code;
};

// MODELLING BLOCKS
pythonGenerator.forBlock["configModel"] = function (block, generator) {
  const number_epoch = block.getFieldValue("epoch");

  const number_portions = block.getFieldValue("portions");

  const number_learningrate = block.getFieldValue("learningRate");

  const dropdown_optimizer = block.getFieldValue("optimizer");

  const text_resetbtn = block.getFieldValue("resetBtn");

  // TODO: change Order.ATOMIC to the correct operator precedence strength
  const value_name = generator.valueToCode(block, "NAME", Order.ATOMIC);

  // TODO: Assemble python into the code variable.
  const code = `model = Model(epoch=${number_epoch}, portions=${number_portions}, learning_rate=${number_learningrate}, optimizer=${dropdown_optimizer}, resetBtn=${text_resetbtn})`;
  // TODO: Change Order.NONE to the correct operator precedence strength
  return [code, Order.NONE];
};
pythonGenerator.forBlock["showAccuracy"] = function (block, generator) {
  // TODO: change Order.ATOMIC to the correct operator precedence strength
  const value_model = generator.valueToCode(block, "model", Order.ATOMIC);

  // TODO: Assemble python into the code variable.
  const code = `showAccuracy(model)`;
  return code;
};
