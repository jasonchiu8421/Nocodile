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
  dataset_path: string // Path to the preprocessed dataset
  training_options: {
    method?: "train_test" | "train_test_val" | "kFold_val"
    layers?: Array<{
      type: string
      units?: number
      activation?: string
      rate?: number
      pool_size?: [number, number]
      filters?: number
      kernel_size?: [number, number]
      strides?: [number, number]
      padding?: string
    }>
    optimizer?: "Adam" | "SGD" | "RMSprop" | "Adagrad" | "Adadelta" | "Nadam" | "Ftrl"
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

export type UploadResponse = string

export type DeleteFileResponse = { message: string }

/** The endpoint returns an object of { [optionName]: string | null }
 *  plus a final 'output' key.
 */
export type PreprocessResponse = {
  output: string
}

export type TrainResponse = {
  "model path": string
  "accuracy graph": string // Base64-encoded PNG image
  "loss graph": string // Base64-encoded PNG image
  "accuracy data": {
    Epoch: number[]
    Accuracy: number[]
    Val_Accuracy: number[]
  }
  "loss data": {
    Epoch: number[]
    Loss: number[]
    Val_Loss: number[]
  }
}

export type PredictResponse = {
  "predicted class": number[] // The class index
  "confidence level": number[] // The max probability
}

export type TestModelResponse = {
  accuracy: number
  "accuracy per class": Record<string, number>
  "accuracy per class graph": string // base64-encoded image
}

export type APIResponse<T> =
  | {
      success: true
      data: T
    }
  | { success: false; error: string }

// ------------------ Actual TS functions to call each route ------------------ //

/**
 * Calls /upload endpoint
 * Expects a CSV file as a single string in the "file" field.
 * Returns a filename string, e.g. "dataset_abc123.h5"
 */
export const uploadDataset = async (csvFile: File): Promise<APIResponse<UploadResponse>> => {
  // Construct a FormData object to send the file as multipart form data
  const formData = new FormData()
  formData.append("file", csvFile)

  try {
    // Make the request
    const response = await fetch(`${baseURL}/upload`, {
      method: "POST",
      body: formData,
    })

    // Parse the JSON body
    const data = await response.json()

    // If not okay, parse the error content
    if (!response.ok) {
      // e.g. { "error": "Only CSV files are accepted" } or some other error content
      return { success: false, error: data.error }
    }

    // On success, the FastAPI code returns the string h5_filename
    // Usually this is just a string, e.g. "mydataset.h5"
    return { success: true, data }
  } catch (error) {
    return { success: false, error: `Failed to upload dataset: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Calls the DELETE /delete/{filename} route to remove a .h5 file on the server.
 */
export async function deleteFile(filename: string): Promise<APIResponse<DeleteFileResponse>> {
  // Safely encode the filename in case it has special characters
  const encodedFilename = encodeURIComponent(filename)

  try {
    // Make the DELETE request
    const response = await fetch(`${baseURL}/delete/${encodedFilename}`, {
      method: "DELETE",
    })

    // Parse the JSON body
    const data = await response.json()

    // If the response is not OK, return the error
    if (!response.ok) {
      return { success: false, error: data.error ?? `Failed to delete file '${filename}': Server returned ${response.status} ${response.statusText}` }
    }

    // Otherwise, return the success message
    return { success: true, data: { message: data.message } }
  } catch (error) {
    return { success: false, error: `Failed to delete file '${filename}': ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Calls /preprocess endpoint
 * Takes an ImagePreprocessRequest.
 * Returns a record with paths for each step + a final 'output' path.
 */
export const preprocessDataset = async (preprocessRequest: ImagePreprocessRequest): Promise<APIResponse<PreprocessResponse>> => {
  try {
    const response = await fetch(`${baseURL}/preprocess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preprocessRequest),
    })

    // Parse the JSON body
    const data = await response.json()

    // If the response is not OK, return the error
    if (!response.ok) {
      return { success: false, error: data.error ?? `Failed to preprocess dataset: Server returned ${response.status} ${response.statusText}` }
    }

    // Otherwise, return the success message
    return { success: true, data: data as PreprocessResponse }
  } catch (error) {
    return { success: false, error: `Failed to preprocess dataset: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Calls /predict endpoint
 * Returns predicted class array and confidence level array.
 */
export const predict = async (predictRequest: PredictionRequest): Promise<APIResponse<PredictResponse>> => {
  try {
    const response = await fetch(`${baseURL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(predictRequest),
    })

    // Parse the JSON body
    const data = await response.json()

    // If the response is not OK, return the error
    if (!response.ok) {
      return { success: false, error: data.error ?? `Failed to make prediction: Server returned ${response.status} ${response.statusText}` }
    }

    // Otherwise, return the success message
    return { success: true, data: data as PredictResponse }
  } catch (error) {
    return { success: false, error: `Failed to make prediction: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Calls /test endpoint
 * Returns overall accuracy, per-class accuracy, plus a base64-encoded plot.
 */
export const testModel = async (testRequest: PredictionRequest): Promise<APIResponse<TestModelResponse>> => {
  try {
    const response = await fetch(`${baseURL}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testRequest),
    })

    // Parse the JSON body
    const data = await response.json()

    // If the response is not OK, return the error
    if (!response.ok) {
      return { success: false, error: data.error ?? `Failed to test model: Server returned ${response.status} ${response.statusText}` }
    }

    // Otherwise, return the success message
    return { success: true, data: data as TestModelResponse }
  } catch (error) {
    return { success: false, error: `Failed to test model: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Calls /train endpoint
 * Takes a TrainingRequest with dataset_path and training_options.
 * Returns a TrainResponse with model path and performance data.
 */
export const trainModel = async (trainingRequest: TrainingRequest): Promise<APIResponse<TrainResponse>> => {
  try {
    const response = await fetch(`${baseURL}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trainingRequest),
    })

    // Parse the JSON body
    const data = await response.json()

    // If the response is not OK, return the error
    if (!response.ok) {
      return { success: false, error: data.error ?? `Failed to train model: Server returned ${response.status} ${response.statusText}` }
    }

    // Otherwise, return the success message
    return { success: true, data: data as TrainResponse }
  } catch (error) {
    return { success: false, error: `Failed to train model: ${error instanceof Error ? error.message : String(error)}` }
  }
}
