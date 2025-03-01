import * as Blockly from "blockly/core";
import { pythonGenerator, Order } from "blockly/python";

const configPreprocessing = {
  init: function () {
    this.appendDummyInput("Title").appendField("Preprocessing");
    this.appendDummyInput("label").appendField("Filters:");
    this.appendStatementInput("filters");
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour(135);
  },
};
Blockly.common.defineBlocks({ configPreprocessing: configPreprocessing });
