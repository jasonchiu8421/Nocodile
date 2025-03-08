/**
 * @description Data blocks.
 */

import * as Blockly from "blockly/core";
import { FieldFile } from "./FieldFile.js";
//import { FieldFileInput } from "./_FieldFileInput.js";
function svg2b64(svg) {
  let s = new XMLSerializer().serializeToString(svg);
  let encodedData = window.btoa(s);
  return "data:image/svg+xml;base64," + encodedData;
}

const configDataset = {
  init: function () {
    this.appendDummyInput("Title").appendField("Dataset");
    this.appendDummyInput("datasetName").appendField(
      new Blockly.FieldTextInput("dataset name"),
      "dsName"
    );
    this.appendDummyInput("datasetImgs").appendField(
      new FieldFile("Browse files..."),
      "dsFiles"
    );

    //scalable svg skeleton loader
    /*
    const skeleton = document.createElement("img");
    skeleton.src = "imgSkeleton.svg"*/
    this.imageField_ = this.appendDummyInput("datasetImgPrev").appendField(
      new Blockly.FieldImage("imgSkeleton.svg", 200, 200, "uwu"),
      "dsImgPrev"
    );

    console.log(this.imageField_);
    //this.appendDummyInput().appendField(new Blockly.FieldImage(img));
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setTooltip("Add training data here.");
    this.setHelpUrl("");
    this.setColour(45);
  },

  onFileChange: function (imgSrc) {
    if (this.imageField_) {
      this.imageField_.fieldRow[0].setValue(imgSrc);
    }
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
Blockly.Blocks["fileInputTest"] = {
  init: function () {
    this.setColour(89);
    this.appendDummyInput().appendField("Import training images");
    this.appendDummyInput("").appendField(
      new Blockly.FieldLabel(""),
      "STL_FILENAME"
    );
    this.appendDummyInput("").appendField(
      new FieldFile("Browse"),
      "STL_BUTTON"
    );
    this.setInputsInline(true);
    this.setOutput(true);
    this.setTooltip("");
    this.setHelpUrl("");
  },
};
*/
