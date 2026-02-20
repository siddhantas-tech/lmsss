'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Upload, Video as VideoIcon, Check } from 'lucide-react'
import { updateVideo, uploadVideo } from '@/api/videos'
import { Textarea } from '@/components/ui/textarea'

interface TopicEditDialogProps {
  topic: {
    id: string
    title: string
    videoUrl?: string | null
    video_url?: string | null
    description?: string | null
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
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (topic) {
      setTitle(topic.title || '')
      setDescription(topic.description || '')
      setVideoUrl(topic.videoUrl || topic.video_url || '')
    }
  }, [topic])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !topic) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('topicId', topic.id)

      const res = await uploadVideo(formData)
      setVideoUrl(res.data.url)
      alert('MEDIA ASSET STORED: Video has been uploaded and linked.')
    } catch (err: any) {
      console.error('Upload failed:', err)
      alert('UPLOAD SYSTEM ERROR: Could not commit file to storage.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!topic) return

    if (!title.trim()) {
      alert('IDENTIFICATION REQUIRED: Topic Title cannot be empty.')
      return
    }

    setLoading(true)
    try {
      await updateVideo(topic.id, {
        title: title.trim(),
        description: description.trim(),
        url: videoUrl.trim() || undefined,
      })

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to update topic/video:', err)
      alert(err?.response?.data?.error || 'SYSTEM ERROR: Failed to commit changes to database.')
    } finally {
      setLoading(false)
    }
  }

  if (!topic) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={topic.id}>
      <DialogContent className="sm:max-w-[700px] border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-background p-0 overflow-hidden">
        <DialogHeader className="bg-foreground text-background p-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Edit Curriculum Item</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-primary-foreground text-primary text-[8px] font-black px-1.5 py-0.5 rounded">UUID: {topic.id.slice(0, 8)}...</span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Technical content configuration</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* General Metadata */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">General Metadata (Identity)</Label>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-bold uppercase opacity-50">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-12 text-lg font-bold border-4 border-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-muted/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-bold uppercase opacity-50">Abstract / Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a technical summary of this curriculum module..."
                    className="min-h-[100px] border-4 border-foreground font-medium focus-visible:ring-0 focus-visible:ring-offset-0 transition-all rounded-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media Subsystem */}
          <div className="space-y-4 p-6 border-4 border-foreground bg-muted/5 rounded-none relative">
            <div className="absolute -top-3 left-4 bg-foreground text-background px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
              Media Subsystem [VIDEO_01]
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <VideoIcon className="h-4 w-4" /> Endpoint URL
                </Label>
                <Input
                  placeholder="https://content.riidl.io/industrial-v1.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-12 border-2 border-foreground font-mono text-xs"
                />
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t-2 border-foreground/20" />
                </div>
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
                  <span className="bg-muted px-2 text-muted-foreground">Local Interface</span>
                </div>
              </div>

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
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 border-2 border-foreground font-black uppercase tracking-widest text-[10px] hover:bg-foreground hover:text-background transition-all"
              >
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? 'Transferring Logic...' : 'Select Local Media Source'}
              </Button>

              {videoUrl ? (
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 p-3 border-2 border-emerald-500/30">
                  <Check className="h-4 w-4" /> ASSET_LINK_STABLE: {videoUrl.split('/').pop()?.slice(0, 30)}...
                </div>
              ) : uploading ? (
                <div className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse p-2 border-2 border-dashed border-primary/20 text-center">
                  Committing media data to storage cluster...
                </div>
              ) : (
                <div className="text-[10px] font-black text-destructive uppercase tracking-widest opacity-50 text-center p-2 border-2 border-dashed border-destructive/10">
                  No source linked [NULL_REF]
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-14 flex-1 border-4 border-foreground font-black uppercase tracking-widest text-xs hover:bg-muted"
            >
              Abort
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="h-14 flex-[2] bg-foreground text-background font-black uppercase tracking-widest text-xs hover:bg-muted hover:text-foreground border-4 border-foreground transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Commit Technical Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
