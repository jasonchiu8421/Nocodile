/**
 * Class for an editable text field.
 * @param {string} text The initial content of the field.
 * @param {Function=} opt_changeHandler An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns either the accepted text, a replacement
 *     text, or null to abort the change.
 * @extends {Blockly.Field}
 * @constructor
 */
import * as Blockly from "blockly/core";

export class FieldFile extends Blockly.Field {
  constructor(value, validator) {
    super(value, validator);
    this.CURSOR = "pointer";
    this.SERIALIZABLE = true;
  }

  initView() {
    //console.log(this.fieldGroup_);
    super.initView();
    //console.log(this.textElement_);
    this.textElement_.textContent = "Add photos...";

    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.multiple = true;
    this.fileInput.style.display = "none"; // Hide input element?
    this.fileInput.addEventListener("change", (e) => {
      this.onChange(e);
    });

    this.fieldGroup_.appendChild(this.fileInput);

    this.textElement_.addEventListener("click", () => this.fileInput.click());
    //this.fieldGroup_.appendChild(img);
  }
  dispose() {
    Blockly.WidgetDiv.hideIfOwner(this);
    super.dispose.call(this);
  }

  onChange(e) {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      const fr = new FileReader();
      fr.onload = (e) => {
        const imgSrc = e.target.result;
        this.setValue(imgSrc);
        this.updateDisplay();
        if (this.sourceBlock_) {
          this.sourceBlock_.onFileChange(imgSrc);
        }
      };
      fr.readAsDataURL(file);
    }
  }

  updateDisplay() {
    console.log("update");
    this.textElement_.textContent = this.getValue()
      ? "Files Selected"
      : "Select Files";
  }

  /**
   * Set the text in this field.
   * @param {?string} text New text.
   * @override
   */
  setText(text) {
    if (text === null) {
      // No change if null.
      return;
    }
    if (this.sourceBlock_ && this.changeHandler_) {
      var validated = this.changeHandler_(text);
      // If the new text is invalid, validation returns null.
      // In this case we still want to display the illegal result.
      if (validated !== null && validated !== undefined) {
        text = validated;
      }
    }
    Blockly.Field.prototype.setText.call(this, text);
  }
  /**
   * Show the inline free-text editor on top of the text.
   * @param {boolean=} opt_quietInput True if editor should be created without
   *     focus.  Defaults to false.
   * @private
   */
  showEditor_(opt_quietInput) {
    //console.log("Uhh", this.getValue());
    //this.fileInput.click();
  }

  /**
   * Close the editor, save the results, and dispose of the editable
   * text field's elements.
   * @return {!Function} Closure to call on destruction of the WidgetDiv.
   * @private
   */
  widgetDispose_() {
    console.log("poof");
    var thisField = this;
    return function () {
      var htmlInput = FieldFile.htmlInput_;
      // Save the edit (if it validates).
      var text = htmlInput.value;
      if (thisField.sourceBlock_ && thisField.changeHandler_) {
        var text1 = thisField.changeHandler_(text);
        if (text1 === null) {
          // Invalid edit.
          text = htmlInput.defaultValue;
        } else if (text1 !== undefined) {
          // Change handler has changed the text.
          text = text1;
        }
      }
      thisField.setText(text);
      thisField.sourceBlock_.rendered && thisField.sourceBlock_.render();
      /*Blockly.unbindEvent_(htmlInput.onKeyDownWrapper_);
      Blockly.unbindEvent_(htmlInput.onKeyUpWrapper_);
      Blockly.unbindEvent_(htmlInput.onKeyPressWrapper_);
      Blockly.unbindEvent_(htmlInput.onWorkspaceChangeWrapper_);*/
      FieldFile.htmlInput_ = null;
      // Delete the width property.
      Blockly.WidgetDiv.DIV.style.width = "auto";
    };
  }
}
