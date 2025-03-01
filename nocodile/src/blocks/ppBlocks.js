import * as Blockly from "blockly/core";
import { pythonGenerator, Order } from "blockly/python";

const configPreprocessing = {
  init: function () {
    this.appendDummyInput("Title").appendField("Preprocessing");
    this.appendDummyInput("label").appendField("Filters:");
    this.appendStatementInput("filters");
    this.appendEndRowInput("NAME");
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour(135);
  },
};
Blockly.Blocks["configPreprocessing"] = configPreprocessing;

const addResize = {
  init: function () {
    this.appendDummyInput("resizeSize")
      .appendField("Resize")
      .appendField(new Blockly.FieldNumber(128, 32, 1024, 1), "resizeW")
      .appendField("px *")
      .appendField(new Blockly.FieldNumber(128, 32, 1024, 1), "resizeH")
      .appendField("px");
    this.appendDummyInput("resizeOption").appendField(
      new Blockly.FieldDropdown([
        ["fit", "fit"],
        ["crop", "crop"],
        ["stretch", "stretch"],
      ]),
      "resizeOption"
    );
    this.appendDummyInput("resizeEnable")
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField(new Blockly.FieldCheckbox("TRUE"), "enabled");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour(135);
  },
};
Blockly.Blocks["addResize"] = addResize;

const addGrayscale = {
  init: function () {
    this.appendDummyInput("Title").appendField("Grayscale");
    this.appendDummyInput("grayscale")
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField(new Blockly.FieldCheckbox("TRUE"), "NAME");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Removes colors from images.");
    this.setHelpUrl("");
    this.setColour(135);
  },
};
Blockly.Blocks["addGrayscale"] = addGrayscale;
