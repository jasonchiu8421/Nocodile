import * as Blockly from "blockly/core";
import { pythonGenerator, Order } from "blockly/python";

const configModel = {
  init: function () {
    this.appendDummyInput("Title").appendField("Model training");
    this.appendDummyInput("epoch")
      .appendField("Train for")
      .appendField(new Blockly.FieldNumber(10, 1, 2048, 1), "epoch")
      .appendField("times");
    this.appendDummyInput("forgot")
      .appendField("Break each training cycle into")
      .appendField(new Blockly.FieldNumber(10, 1, 2048, 1), "forgot")
      .appendField("portions");
    this.appendDummyInput("learningRate")
      .appendField("Learning rate:")
      .appendField(new Blockly.FieldNumber(10, 0, 2048, 1), "forgot");
    this.appendDummyInput("optimizer")
      .appendField("Optimize with")
      .appendField(
        new Blockly.FieldDropdown([
          ["option", "OPTIONNAME"],
          ["option", "OPTIONNAME"],
          ["option", "OPTIONNAME"],
        ]),
        "optimizer"
      );
    this.appendDummyInput("NAME").appendField(
      new Blockly.FieldTextInput("SET TO DEFAULT BUTTON"),
      "resetBtn"
    );
    this.appendValueInput("NAME").appendField(
      "another output for accuracy checker"
    );
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour(0);
  },
};
Blockly.common.defineBlocks({ configModel: configModel });

const showAccuracy = {
  init: function () {
    this.appendDummyInput("Title").appendField("Accuracy");
    this.appendValueInput("model")
      .setCheck("model")
      .appendField("SHOW ACCURACY GRAPH HERE");
    this.setInputsInline(false);
    this.setTooltip("");
    this.setHelpUrl("");
    this.setColour(0);
  },
};
Blockly.common.defineBlocks({ showAccuracy: showAccuracy });
