/**
 * @description Data blocks.
 */

import * as Blockly from "blockly/core";
import { FieldButton } from "./FieldButton.js";
import { FieldFileInput } from "./FieldFileInput.js";

const configDataset = {
  init: function () {
    this.appendDummyInput("Title").appendField("Data");
    this.appendDummyInput("datasetName").appendField(
      new Blockly.FieldTextInput("dataset name"),
      "dsName"
    );
    this.appendDummyInput("NAME").appendField(
      new Blockly.FieldTextInput("UPLOAD FILES HERE"),
      "dsGroup"
    );
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setTooltip("What data does the model use to learn?");
    this.setHelpUrl("");
    this.setColour(45);
  },
};
Blockly.common.defineBlocks({ configDataset: configDataset });

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

/*
const fileInputTest = {
  init: function () {
    this.setColour(269); // Set block color
    this.appendDummyInput("Title").appendField("Upload Files:");
    //console.log("dlfjksf");
    this.appendDummyInput("FILE_INPUT").appendField(
      new FieldFileInput("Upload files: ")
    );

    this.setOutput(true, null);
    this.setTooltip("Upload files yeeyeeyee");
    this.setHelpUrl("http://www.example.com");
  },
};
Blockly.Blocks["fileInputTest"] = fileInputTest;
*/

Blockly.Blocks["fileInputTest"] = {
  init: function () {
    this.setColour(89);
    this.appendDummyInput().appendField("STL Import");
    this.appendDummyInput("").appendField(
      new Blockly.FieldLabel(""),
      "STL_FILENAME"
    );
    this.appendDummyInput("").appendField(
      new FieldButton("Browse"),
      "STL_BUTTON"
    );
    this.appendDummyInput("C").appendField(
      new Blockly.FieldLabel(""),
      "STL_CONTENTS"
    );
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setTooltip("");
    this.setWarningText("STL files are not saved with your blocks.");
    this.setHelpUrl("");
  },
};
