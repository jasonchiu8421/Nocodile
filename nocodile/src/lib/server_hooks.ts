/**
 * Server API hooks for calling the backend API
 */

// Base server URL
const SERVER_URL = "http://localhost:8888"

/**
 * Upload a CSV file
 * @param file The CSV file to upload
 */
export const uploadCSV = async (file: File): Promise<any> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${SERVER_URL}/upload`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Delete a dataset
 * @param datasetPath Path to the dataset to delete
 */
export const deleteDataset = async (datasetPath: string): Promise<any> => {
  const response = await fetch(`${SERVER_URL}/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataset_path: datasetPath }),
  })

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Preprocess a dataset
 * @param datasetPath Path to the dataset
 * @param options Preprocessing options
 */
export const preprocessDataset = async (
  datasetPath: string,
  options: {
    resize?: [number, number]
    rgb2gray?: number
    shuffle?: number
    normalize?: number
    save_option?: string
  } = {}
): Promise<any> => {
  const defaultOptions = {
    resize: [28, 28],
    rgb2gray: 0,
    shuffle: 0,
    normalize: 0,
    save_option: "one image per class",
  }

  const response = await fetch(`${SERVER_URL}/preprocess`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset_path: datasetPath,
      options: { ...defaultOptions, ...options },
    }),
  })

  if (!response.ok) {
    throw new Error(`Preprocessing failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Train a model
 * @param preprocessedImages Array of preprocessed image paths
 * @param labels Array of labels for the images
 * @param trainingOptions Options for model training
 */
export const trainModel = async (
  preprocessedImages: string[],
  labels: number[],
  trainingOptions: {
    method?: string
    layers?: Array<any>
    optimizer?: string
    loss?: string
    metrics?: string[]
    lr?: number
    epochs?: number
    batch_size?: number
    kFold_k?: number
  } = {}
): Promise<any> => {
  const defaultTrainingOptions = {
    method: "train_test_val",
    layers: [{ type: "Flatten" }, { type: "Dense", units: 512, activation: "relu" }, { type: "Dense", units: 10, activation: "softmax" }],
    optimizer: "Adam",
    loss: "categorical_crossentropy",
    metrics: ["accuracy"],
    lr: 0.01,
    epochs: 10,
    batch_size: 64,
    kFold_k: 5,
  }

  const response = await fetch(`${SERVER_URL}/train_model`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      preprocessed_images: preprocessedImages,
      labels: labels,
      training_options: { ...defaultTrainingOptions, ...trainingOptions },
    }),
  })

  if (!response.ok) {
    throw new Error(`Model training failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Make predictions using a trained model
 * @param modelPath Path to the trained model
 * @param dataPath Path to the data for prediction
 * @param options Preprocessing options for the prediction data
 */
export const predict = async (
  modelPath: string,
  dataPath: string,
  options: {
    resize?: [number, number]
    rgb2gray?: number
    shuffle?: number
    normalize?: number
    save_option?: string
  } = {}
): Promise<any> => {
  const defaultOptions = {
    resize: [28, 28],
    rgb2gray: 0,
    shuffle: 0,
    normalize: 0,
    save_option: "one image per class",
  }

  const response = await fetch(`${SERVER_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_path: modelPath,
      data_path: dataPath,
      options: { ...defaultOptions, ...options },
    }),
  })

  if (!response.ok) {
    throw new Error(`Prediction failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Test a model on a dataset with labels
 * @param modelPath Path to the trained model
 * @param dataPath Path to the test data with labels
 */
export const testModel = async (modelPath: string, dataPath: string): Promise<any> => {
  const response = await fetch(`${SERVER_URL}/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_path: modelPath,
      data_path: dataPath,
    }),
  })

  if (!response.ok) {
    throw new Error(`Model testing failed: ${response.statusText}`)
  }

  return response.json()
}
