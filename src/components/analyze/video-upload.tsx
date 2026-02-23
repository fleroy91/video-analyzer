"use client"

import { useCallback, useState } from "react"
import { Upload, Link as LinkIcon, X, Film } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface VideoUploadProps {
  onFileChange: (file: File | undefined) => void
  onUrlChange: (url: string) => void
  fileError?: string
  urlError?: string
}

export function VideoUpload({
  onFileChange,
  onUrlChange,
  fileError,
  urlError,
}: VideoUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith("video/")) {
        setSelectedFile(file)
        onFileChange(file)
        onUrlChange("")
      }
    },
    [onFileChange, onUrlChange]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      onFileChange(file)
      onUrlChange("")
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    onFileChange(undefined)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "upload") {
      onUrlChange("")
    } else {
      setSelectedFile(null)
      onFileChange(undefined)
    }
  }

  return (
    <div className="grid gap-3">
      <Label className="text-base font-medium">Video</Label>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="mr-1.5 h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="mr-1.5 h-4 w-4" />
            Paste URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3">
          {selectedFile ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Film className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onClick={() =>
                document.getElementById("video-file-input")?.click()
              }
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag & drop your video here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (max 15s, 50MB)
              </p>
              <input
                id="video-file-input"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}
          {fileError && (
            <p className="mt-1 text-sm text-destructive">{fileError}</p>
          )}
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <Input
            placeholder="https://www.tiktok.com/@user/video/..."
            onChange={(e) => {
              onUrlChange(e.target.value)
              onFileChange(undefined)
            }}
          />
          {urlError && (
            <p className="mt-1 text-sm text-destructive">{urlError}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
