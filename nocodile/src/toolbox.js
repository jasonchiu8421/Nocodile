/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Data",
      categoryStyle: "logic_category",
      contents: [
        {
          kind: "block",
          type: "configDataset",
        },
        {
          kind: "block",
          type: "configDoodle",
        },
        {
          kind: "block",
          type: "fileInputTest",
        },
      ],
    },
    {
      kind: "category",
      name: "Preprocessing",
      categoryStyle: "logic_category",
      contents: [
        {
          kind: "block",
          type: "configPreprocessing",
        },
        { kind: "sep" },
        {
          kind: "block",
          type: "addResize",
        },
        {
          kind: "block",
          type: "addGrayscale",
        },
      ],
    },
    {
      kind: "category",
      name: "Model training",
      categoryStyle: "logic_category",
      contents: [
        {
          kind: "block",
          type: "configModel",
        },
        {
          kind: "block",
          type: "showAccuracy",
        },
      ],
    },
  ],
};
// how to config category style
