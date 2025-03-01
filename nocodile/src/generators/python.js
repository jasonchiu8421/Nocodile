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

// PREPROCESSING BLOCKS
pythonGenerator.forBlock["configPreprocessing"] = function (block, generator) {
  const statement_filters = generator.statementToCode(block, "filters");

  // TODO: Assemble python into the code variable.
  const code = "preprocessor.config = ";
  // TODO: Change Order.NONE to the correct operator precedence strength
  return [code, Order.NONE];
};

pythonGenerator.forBlock["addResize"] = function (block, generator) {
  const number_resizew = block.getFieldValue("resizeW");
  const number_resizeh = block.getFieldValue("resizeH");

  const dropdown_resizeoption = block.getFieldValue("resizeOption");

  const checkbox_enabled = block.getFieldValue("enabled");

  // TODO: Assemble python into the code variable.
  const code = "...";
  return code;
};
