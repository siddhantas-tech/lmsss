'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Upload, Video as VideoIcon, Plus, Trash2, ExternalLink } from 'lucide-react'
import { updateVideo, uploadVideo, createVideo } from '@/api/videos'
import { Textarea } from '@/components/ui/textarea'

interface TopicEditDialogProps {
  topic: {
    id: string
    title: string
    videoUrl?: string | null
    video_url?: string | null
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

  // Multiple videos management
  const [videos, setVideos] = useState<any[]>([])
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
        title: newVideoTitle.trim() || `${topic.title} - Case Study`,
        url: newVideoUrl.trim(),
        courseId: (topic as any).course_id || (topic as any).courseId || '',
        topicId: topic.id
      })
      alert('ASSET INTEGRATED: New video resource linked to topic.')
      setNewVideoUrl('')
      setNewVideoTitle('')
      onSuccess() // Reload parent
    } catch (err) {
      console.error(err)
      alert('ERROR: Failed to link video resource.')
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
      formData.append('courseId', (topic as any).course_id || (topic as any).courseId || '')
      formData.append('title', newVideoTitle.trim() || `${topic.title} - Material`)

      await uploadVideo(formData)
      alert('MEDIA ASSET STORED: Video has been uploaded and linked.')
      setNewVideoTitle('')
      onSuccess() // Reload parent
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
      <DialogContent className="sm:max-w-[800px] border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-background p-0 overflow-hidden">
        <DialogHeader className="bg-foreground text-background p-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Topic Configuration</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-primary-foreground text-primary text-[8px] font-black px-1.5 py-0.5 rounded">ID: {topic.id}</span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Curriculum Item Settings</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Metadata Block */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topic Identity</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Fundamental Mechanics"
                  className="h-12 text-lg font-bold border-4 border-foreground focus-visible:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Technical Abstract</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the learning outcomes..."
                  className="min-h-[80px] border-2 border-foreground font-medium rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Videos Block */}
          <div className="space-y-6 pt-6 border-t-4 border-dashed border-border">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Media Library (Multiple Videos Support)</Label>
            </div>

            {/* Current Videos List */}
            <div className="space-y-3">
              {videos.length > 0 ? (
                videos.map((v, i) => (
                  <div key={v.id || i} className="flex items-center gap-4 p-4 border-2 border-foreground bg-muted/5 group">
                    <div className="h-10 w-10 flex items-center justify-center bg-foreground text-background text-xs font-black">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase truncate">{v.title || 'Untitled Video'}</p>
                      <p className="text-[9px] font-bold text-muted-foreground truncate font-mono uppercase opacity-60 tracking-tighter">{v.url || v.video_path}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={v.url || v.video_path} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 border-2 border-dashed border-border text-center text-[10px] font-black uppercase text-muted-foreground">
                  No video assets attached to this topic
                </div>
              )}
            </div>

            {/* Add Video Form */}
            <div className="p-6 border-4 border-foreground bg-muted/10 space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Plus className="h-3 w-3" /> Append New Media Resource
              </h5>

              <div className="space-y-3">
                <Input
                  placeholder="Asset Title (e.g. Part 2: Implementation)"
                  value={newVideoTitle}
                  onChange={e => setNewVideoTitle(e.target.value)}
                  className="h-9 border-2 font-bold text-xs"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-60">URL Direct Link</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={newVideoUrl}
                        onChange={e => setNewVideoUrl(e.target.value)}
                        className="h-9 border-2 text-xs font-mono"
                      />
                      <Button size="sm" onClick={handleAddVideoUrl} disabled={loading || !newVideoUrl} className="font-black">APPLY</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-60">Upload Local File</Label>
                    <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={handleFileUpload} />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-9 border-2 border-foreground font-black text-[10px] uppercase"
                    >
                      {uploading ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                      {uploading ? 'Processing...' : 'Upload Asset'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-14 flex-1 border-4 border-foreground font-black uppercase tracking-widest text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="h-14 flex-[2] bg-foreground text-background font-black uppercase tracking-widest text-xs hover:bg-muted hover:text-foreground border-4 border-foreground transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Topic Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
