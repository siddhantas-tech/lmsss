'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Upload, Plus, Trash2, ExternalLink } from 'lucide-react'
import { uploadVideo, createVideo, deleteVideo } from '@/api/videos'
import { updateTopic } from '@/api/topics'
import { Textarea } from '@/components/ui/textarea'

interface TopicEditDialogProps {
  topic: {
    id: string
    title: string
    description?: string | null
    videos?: any[]
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
  const [videos, setVideos] = useState<any[]>([])

  // New video state
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (topic) {
      setTitle(topic.title || '')
      setDescription(topic.description || '')
      setVideos(topic.videos || [])
    }
  }, [topic])

  async function handleAddVideoUrl() {
    if (!topic || !newVideoUrl.trim()) return
    setLoading(true)
    try {
      await createVideo({
        title: newVideoTitle.trim() || `${title} - Part ${videos.length + 1}`,
        url: newVideoUrl.trim(),
        courseId: (topic as any).courseId || '',
        topicId: topic.id
      })
      setNewVideoUrl('')
      setNewVideoTitle('')
      onSuccess()
    } catch (err) {
      console.error(err)
      alert('Error linking video.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !topic) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('topicId', topic.id)
      formData.append('courseId', (topic as any).courseId || '')
      formData.append('title', newVideoTitle.trim() || `${title} - Part ${videos.length + 1}`)

      await uploadVideo(formData)
      setNewVideoTitle('')
      onSuccess()
    } catch (err: any) {
      console.error('Upload failed:', err)
      alert(`Upload failed: ${err?.response?.data?.message || err?.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteVideo(videoId: string) {
    if (!confirm('Remove this video?')) return
    setLoading(true)
    try {
      await deleteVideo(videoId)
      onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!topic) return
    if (!title.trim()) return

    setLoading(true)
    try {
      await updateTopic(topic.id, {
        title: title.trim(),
        description: description.trim(),
      })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to update topic:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!topic) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="bg-foreground text-background p-6">
          <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Topic Editor</DialogTitle>
          <p className="text-[10px] font-bold uppercase opacity-60">Control Curriculum Assets</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Metadata Section */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10 font-bold border-2 border-foreground focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px] border-2 border-foreground font-medium rounded-none resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Video List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Topic Videos ({videos.length})</Label>
            </div>

            <div className="space-y-2">
              {videos.length > 0 ? (
                videos.map((v, i) => (
                  <div key={v.id || i} className="flex items-center gap-3 p-3 border-2 border-foreground bg-muted/10 group">
                    <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-foreground text-background text-xs font-black">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase truncate">{v.title || 'Untitled Video'}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <a href={v.url || v.video_path} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteVideo(v.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 border-2 border-dashed border-border text-center text-[10px] font-bold uppercase text-muted-foreground bg-muted/5">
                  No videos added yet
                </div>
              )}
            </div>

            {/* Quick Add Video Section */}
            <div className="p-4 border-2 border-dashed border-foreground/30 bg-muted/5 space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground">
                <Plus className="h-3 w-3" /> Add Video Asset
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Asset Title (e.g. Intro Part 1)"
                  value={newVideoTitle}
                  onChange={e => setNewVideoTitle(e.target.value)}
                  className="h-8 text-xs font-bold border-2"
                />

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Paste Video URL..."
                      value={newVideoUrl}
                      onChange={e => setNewVideoUrl(e.target.value)}
                      className="h-9 text-xs font-medium border-2 pr-20"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddVideoUrl}
                      disabled={loading || !newVideoUrl}
                      className="absolute right-1 top-1 bottom-1 h-7 text-[9px] font-black"
                    >
                      ADD URL
                    </Button>
                  </div>

                  <div className="flex-shrink-0">
                    <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={handleFileUpload} />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-9 border-2 border-foreground font-black text-[9px]"
                    >
                      {uploading ? <Loader2 className="animate-spin h-3 w-3" /> : <Upload className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1 border-2 border-foreground font-black uppercase text-[10px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="h-11 flex-[2] bg-foreground text-background font-black uppercase text-[10px] border-2 border-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              Save Topic Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
