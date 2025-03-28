/**
 * api.ts
 * Example TypeScript functions to call your FastAPI routes.
 */

const baseURL = "http://localhost:8888"
// Adjust to match wherever your FastAPI app is hosted

// ------------------ Interfaces for request bodies ------------------ //

export interface ImagePreprocessRequest {
  dataset_path: string
  options: {
    resize?: [number, number]
    grayscale?: boolean
    shuffle?: boolean
    normalize?: boolean
    save_option?: "whole dataset" | "one image per class"
  }
}

export interface TrainingRequest {
  preprocessed_images: string[] // e.g. ["preprocessed_dataset1.h5", ...]
  labels: number[] // e.g. [0,1,2,3,...]
  training_options: {
    method?: "train_test" | "train_test_val" | "kFold_val"
    layers?: Array<Record<string, any>>
    optimizer?: string
    loss?: string
    metrics?: string[]
    lr?: number
    epochs?: number
    batch_size?: number
    kFold_k?: number
  }
}

export interface PredictionRequest {
  model_path: string
  input_data: string // e.g. Base64 data or entire CSV file contents
}

// ------------------ Interfaces for response bodies ------------------ //

export interface TrainResponseFirst {
  status: string // e.g. "success"
  message: string // e.g. "Training initiated with N images"
}

export type UploadResponse = string | { error: string }

export type DeleteFileResponse = { message: string } | { error: string }

/** The endpoint returns an object of { [optionName]: string | null }
 *  plus a final 'output' key.
 */
export type PreprocessResponse = {
  output: string
}

export interface TrainResponse {
  // Example structure that your snippet returns:
  "model path": string
  "accuracy graph": any // Possibly base64 or some image structure
  "loss graph": any
  "accuracy data": any // Possibly an array or object with numeric logs
  "loss data": any
}

export interface PredictResponse {
  "predicted class": number[] // The class index
  "confidence level": number[] // The max probability
}

export interface TestModelResponse {
  accuracy: number
  "accuracy per class": Record<string, number>
  "accuracy per class graph": string // base64-encoded image
}

// ------------------ Actual TS functions to call each route ------------------ //

/**
 * Calls /upload endpoint
 * Expects a CSV file as a single string in the "file" field.
 * Returns a filename string, e.g. "dataset_abc123.h5"
 */
export const uploadDataset = async (csvFile: File): Promise<UploadResponse> => {
  // Construct a FormData object to send the file as multipart form data
  const formData = new FormData()
  formData.append("file", csvFile)

  // Make the request
  const response = await fetch(`${baseURL}/upload`, {
    method: "POST",
    body: formData,
  })

  // If not okay, parse the error content
  if (!response.ok) {
    // e.g. { "error": "Only CSV files are accepted" } or some other error content
    return await response.json()
  }

  // On success, the FastAPI code returns the string h5_filename
  // Usually this is just a string, e.g. "mydataset.h5"
  return await response.json()
}

/**
 * Calls the DELETE /delete/{filename} route to remove a .h5 file on the server.
 */
export async function deleteFile(filename: string): Promise<DeleteFileResponse> {
  // Safely encode the filename in case it has special characters
  const encodedFilename = encodeURIComponent(filename)

  // Make the DELETE request
  const response = await fetch(`${baseURL}/delete/${encodedFilename}`, {
    method: "DELETE",
  })

  // Parse the JSON body
  const data = await response.json()

  // If the response is not OK, return the error
  if (!response.ok) {
    return {
      error: data.error ?? "Unknown error occurred while deleting the file",
    }
  }

  // Otherwise, return the success message
  return {
    message: data.message,
  }
}

/**
 * Calls /preprocess endpoint
 * Takes an ImagePreprocessRequest.
 * Returns a record with paths for each step + a final 'output' path.
 */
export const preprocessDataset = async (preprocessRequest: ImagePreprocessRequest): Promise<PreprocessResponse> => {
  const response = await fetch(`${baseURL}/preprocess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preprocessRequest),
  })

  // Parse the JSON body
  const data = await response.json()

  // If the response is not OK, return the error
  if (!response.ok) {
    throw new Error(data.error ?? "Unknown error occurred while deleting the file")
  }

  // Otherwise, return the success message
  return data as PreprocessResponse
}

/**
 * Calls /predict endpoint
 * Returns predicted class array and confidence level array.
 */
export const predict = async (predictRequest: PredictionRequest): Promise<PredictResponse> => {
  const response = await fetch(`${baseURL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(predictRequest),
  })

  // Parse the JSON body
  const data = await response.json()

  // If the response is not OK, return the error
  if (!response.ok) {
    throw new Error(data.error ?? "Unknown error occurred while deleting the file")
  }

  // Otherwise, return the success message
  return data as PredictResponse
}

/**
 * Calls /test endpoint
 * Returns overall accuracy, per-class accuracy, plus a base64-encoded plot.
 */
export const testModel = async (testRequest: PredictionRequest): Promise<TestModelResponse> => {
  const response = await fetch(`${baseURL}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testRequest),
  })
  
  // Parse the JSON body
  const data = await response.json()

  // If the response is not OK, return the error
  if (!response.ok) {
    throw new Error(data.error ?? "Unknown error occurred while deleting the file")
  }

  // Otherwise, return the success message
  return data as TestModelResponse
}
