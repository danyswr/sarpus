"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ImageIcon, X } from "lucide-react"

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void
  onImageRemove: () => void
  selectedImage: string
}

export function ImageUpload({ onImageSelect, onImageRemove, selectedImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      // Convert to base64 for demo purposes
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageSelect(result)
        setIsUploading(false)
      }
      reader.onerror = () => {
        alert("Error reading file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading image")
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="relative">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {selectedImage ? (
        <div className="relative">
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <button type="button" onClick={handleClick} className="p-2 hover:bg-blue-50 rounded-full group">
            <ImageIcon className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="p-2 hover:bg-blue-50 rounded-full group disabled:opacity-50"
        >
          <ImageIcon className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
        </button>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}
