import { clsx, type ClassValue } from "clsx"

type SonnerToast = {
  type: "success" | "error" | "warning" | "info"
  message: string
  description?: string
}

import { useState } from "react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useForceUpdate() {
  const [value, setValue] = useState(0) // integer state
  return () => setValue((value) => value + 1) // update state to force render
  // A function that increment 👆🏻 the previous state like here
  // is better than directly setting `setValue(value + 1)`
}

export function encodeImageAsBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to read image as data URL"))
      }
    }
    reader.readAsDataURL(file)
  })
}
// works
export function filterOutKeys<T extends object, K extends (keyof T)[]>(obj: T, keys: K): Omit<T, K[number]> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K[number]))) as Omit<T, K[number]>
}
