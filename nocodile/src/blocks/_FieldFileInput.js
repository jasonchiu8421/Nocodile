import * as Blockly from "blockly/core";

export class FieldFileInput extends Blockly.Field {
  constructor(value, validator) {
    super(value, validator);

    this.SERIALIZABLE = true;
  }

  initView() {
    super.initView();

    // Create the file input element
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.multiple = true;
    //this.fileInput.style.display = "none"; // Hide input element?
    this.fileInput.addEventListener("change", (e) => {
      this.onChange(e);
    });

    // Append the file input element to the field group
    this.fieldGroup_.appendChild(this.fileInput);

    // Create the button element
    this.textElement_ = document.createElement("button");
    this.textElement_.textContent = "Select Files";
    this.textElement_.addEventListener("click", () => this.fileInput.click());

    // Append the button element to the field group
    //this.fieldGroup_.appendChild(this.textElement_);
  }

  onChange(e) {
    console.log("dildjdkjk");
    const files = e.target.files;
    if (files) {
      for (const file of files) {
        const fr = new FileReader();
        fr.onload = (e) => {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.width = 200;
          this.fieldGroup_.appendChild(img);
        };
        fr.readAsDataURL(file);
      }
      this.setValue(files);
      this.updateDisplay();
      console.log("uploaded files:", files);
    }
  }

  updateDisplay() {
    console.log("update");
    this.textElement_.textContent = this.getValue()
      ? "Files Selected"
      : "Select Files";
  }
}

Blockly.fieldRegistry.register("fieldFileInput", FieldFileInput);
FieldFileInput.fromJson = function (options) {
  const fileName = Blockly.utils.parsing.replaceMessageReferences(
    options["fileInput"]
  );
  return new FieldFileInput(fileName);
};
