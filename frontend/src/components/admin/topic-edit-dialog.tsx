'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Upload, Video as VideoIcon } from 'lucide-react'
import { updateVideo } from '@/api/videos'

interface TopicEditDialogProps {
  topic: {
    id: string
    title: string
    video_url?: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TopicEditDialog({
  topic,
  open,
  onOpenChange,
  onSuccess,
}: TopicEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVideoUrl(topic?.video_url || '')
  }, [topic])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    alert(
      'Direct upload is not supported.\n\nUpload the video to Supabase storage and paste the public URL.'
    )
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!topic) return

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string

    if (!title.trim()) {
      alert('Title is required')
      return
    }

    setLoading(true)
    try {
      await updateVideo(topic.id, {
        title,
        url: videoUrl || null,
      })

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to update topic/video:', err)
      alert(err?.response?.data?.error || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  if (!topic) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Topic</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1">
            <Label>Topic Title</Label>
            <Input
              name="title"
              defaultValue={topic.title}
              required
            />
          </div>

          {/* Video */}
          <div className="space-y-3 border p-3 rounded-md">
            <Label className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" /> Video URL
            </Label>

            <Input
              placeholder="https://…mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={handleFileUpload}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload via Supabase (manual)
            </Button>

            {videoUrl && (
              <p className="text-xs text-green-600 font-bold">
                Video URL set
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}