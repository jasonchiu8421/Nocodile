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
    this.NOTCH_WIDTH = 30;

    /**
     * The height of the notch used for previous and next connections.
     * @type {number}
     * @override
     */
    this.NOTCH_HEIGHT = 10;

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

  /**
   * @returns Arrow notch for previous/next connections
   */
  makeArrowPrevCon() {
    const width = this.NOTCH_WIDTH;
    const height = this.NOTCH_HEIGHT;

    /**
     * Since previous and next connections share the same shape you can define
     * a function to generate the path for both.
     *
     * @param dir Multiplier for the horizontal direction of the path (-1 or 1)
     * @returns SVGPath line for use with previous and next connections.
     */
    /*The points are move by x,y units, pov */
    function makeMainPath(dir) {
      let line = [
        Blockly.utils.svgPaths.point((dir * -width * 1) / 3, 0), //go to base of arrow
        Blockly.utils.svgPaths.point(0, (height * 2) / 3), // down
        Blockly.utils.svgPaths.point((dir * width) / 3, 0), // right
        Blockly.utils.svgPaths.point((dir * -width) / 2, height / 3), // down left
        Blockly.utils.svgPaths.point((dir * -width) / 2, -height / 3), // up left
        Blockly.utils.svgPaths.point((dir * width) / 3, 0), // right
        Blockly.utils.svgPaths.point(0, (-height * 2) / 3), //up
        Blockly.utils.svgPaths.point((dir * (-width * 1)) / 3, 0), //go to top corner
      ];
      return Blockly.utils.svgPaths.line(line);
    }
    const pathLeft = makeMainPath(-1);
    const pathRight = makeMainPath(1);

    return {
      width: width,
      height: height,
      pathLeft: pathLeft,
      pathRight: pathRight,
    };
  }

  /**
   * @returns Rectangular puzzle tab for use with input and output connections.
   */
  makeRectangularInputConn() {
    const width = this.TAB_WIDTH;
    const height = this.TAB_HEIGHT;

    /**
     * Since input and output connections share the same shape you can define
     * a function to generate the path for both.
     *
     * @param dir Multiplier for the vertical direction of the path (-1 or 1)
     * @returns SVGPath line for use with input and output connections.
     */
    function makeMainPath(dir) {
      return Blockly.utils.svgPaths.line([
        Blockly.utils.svgPaths.point(-width, 0),
        Blockly.utils.svgPaths.point(0, dir * height),
        Blockly.utils.svgPaths.point(width, 0),
      ]);
    }
    const pathUp = makeMainPath(-1);
    const pathDown = makeMainPath(1);

    return {
      width: width,
      height: height,
      pathUp: pathUp,
      pathDown: pathDown,
    };
  }

  /**
   * @override
   */
  init() {
    // First, call init() in the base provider to store the default objects.
    super.init();

    // Add calls to create shape objects for the new connection shapes.
    this.RECT_PREV_NEXT = this.makeArrowPrevCon();
    this.RECT_INPUT_OUTPUT = this.makeRectangularInputConn();
  }

  /**
   * @override
   */
  shapeFor(connection) {
    switch (connection.type) {
      case Blockly.INPUT_VALUE:
      case Blockly.OUTPUT_VALUE:
        return this.RECT_INPUT_OUTPUT;
      case Blockly.PREVIOUS_STATEMENT:
      case Blockly.NEXT_STATEMENT:
        return this.RECT_PREV_NEXT;
      default:
        throw Error("Unknown connection type");
    }
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
