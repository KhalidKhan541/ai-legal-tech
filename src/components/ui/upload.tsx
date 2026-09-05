"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Upload as UploadIcon,
  X,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  onFilesChange?: (files: File[]) => void
  onUpload?: (files: File[]) => Promise<void>
  disabled?: boolean
  className?: string
  label?: string
  description?: string
}

function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  onFilesChange,
  onUpload,
  disabled = false,
  className,
  label = "Drop files here or click to upload",
  description,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = React.useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const validFiles = fileArray.filter((file) => {
        if (maxSize && file.size > maxSize) return false
        if (maxFiles && files.length + fileArray.length > maxFiles) return false
        return true
      })

      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
    },
    [files, multiple, maxSize, maxFiles, onFilesChange]
  )

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleUpload = async () => {
    if (!onUpload || files.length === 0) return
    setUploading(true)
    try {
      await onUpload(files)
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || ""))
      return <Image className="h-5 w-5 text-blue-500" />
    if (["xlsx", "xls", "csv"].includes(ext || ""))
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext || ""))
      return <FileText className="h-5 w-5 text-red-500" />
    return <File className="h-5 w-5 text-slate-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-slate-900 bg-slate-50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <UploadIcon
          className={cn(
            "mb-2 h-8 w-8",
            isDragging ? "text-slate-900" : "text-slate-400"
          )}
        />
        <p className="mb-1 text-sm font-medium text-slate-700">{label}</p>
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
        {accept && (
          <p className="mt-1 text-xs text-slate-400">
            Accepted: {accept}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ""
        }}
        className="hidden"
        disabled={disabled}
      />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3"
            >
              {getFileIcon(file.name)}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {onUpload && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  Upload {files.length} file{files.length > 1 ? "s" : ""}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface UploadAreaProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  multiple?: boolean
  className?: string
}

function UploadArea({
  onUpload,
  accept,
  multiple = true,
  className,
}: UploadAreaProps) {
  const [uploading, setUploading] = React.useState(false)
  const [uploaded, setUploaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleUpload = async (files: File[]) => {
    setUploading(true)
    setError(null)
    try {
      await onUpload(files)
      setUploaded(true)
      setTimeout(() => setUploaded(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <FileUpload
        accept={accept}
        multiple={multiple}
        onUpload={handleUpload}
        label={uploaded ? "Upload complete!" : "Drop files to upload"}
      />
      {uploaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-emerald-50/90">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}

export { FileUpload, UploadArea }
