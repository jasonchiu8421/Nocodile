import * as Blockly from "blockly/core";
import { pythonGenerator, Order } from "blockly/python";

const configDataset = {
  init: function () {
    this.appendDummyInput("Title").appendField("Data");
    this.appendDummyInput("datasetName").appendField(
      new Blockly.FieldTextInput("dataset name"),
      "dsName"
    );
    this.appendValueInput("NAME")
      .setCheck("Array")
      .appendField(new Blockly.FieldTextInput("UPLOAD FILES HERE"), "dsGroup");
    this.setInputsInline(false);
    this.setNextStatement(true, null);
    this.setTooltip("What data does the model use to learn?");
    this.setHelpUrl("");
    this.setColour(45);
  },
};
Blockly.Blocks["configDataset"] = configDataset;

const configDoodle = {
  init: function () {
    this.appendDummyInput("Title").appendField("Doodle");
    this.appendDummyInput("NAME").appendField(
      new Blockly.FieldTextInput("PUT DOODLE FRAME HERE"),
      "doodleImg"
    );
    this.appendDummyInput("NAME")
      .appendField(new Blockly.FieldTextInput("PENCIL"), "pencilBtn")
      .appendField(new Blockly.FieldTextInput("CLEAR"), "clearBtn");
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour(45);
  },
};
Blockly.Blocks["configDoodle"] = configDoodle;
