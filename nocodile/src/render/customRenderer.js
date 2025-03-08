import * as Blockly from "blockly/core";

class CustomConstantProvider extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    // Set up all of the constants from the base provider.
    super();

    // Override a few properties.
    /**
     * The width of the notch used for previous and next connections.
     * @type {number}
     * @override
     */
    this.NOTCH_WIDTH = 200;

    /**
     * The height of the notch used for previous and next connections.
     * @type {number}
     * @override
     */
    this.NOTCH_HEIGHT = 40;

    /**
     * Rounded corner radius.
     * @type {number}
     * @override
     */
    this.CORNER_RADIUS = 5;

    /**
     * The height of the puzzle tab used for input and output connections.
     * @type {number}
     * @override
     */
    this.TAB_HEIGHT = 8;
  }
}

class CustomRenderer extends Blockly.blockRendering.Renderer {
  constructor() {
    super();
  }
  makeConstants_() {
    return new CustomConstantProvider();
  }
}

Blockly.blockRendering.register("customRenderer", CustomRenderer);
