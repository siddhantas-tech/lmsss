import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Upload, Video as VideoIcon } from 'lucide-react'

interface TopicEditDialogProps {
    topic: {
        id: string
        title: string
        description?: string
        video_url?: string
        video_duration_seconds?: number
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function TopicEditDialog({ topic, open, onOpenChange, onSuccess }: TopicEditDialogProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [videoUrl, setVideoUrl] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (topic?.video_url) {
            setVideoUrl(topic.video_url)
        } else {
            setVideoUrl('')
        }
    }, [topic])

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        alert('Video upload must be handled by the backend (Supabase removed from frontend).')
        e.target.value = ''
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!topic) return

        setLoading(true)
        setLoading(false)
        alert('Saving topic must be handled by the backend (Supabase removed from frontend).')
    }

    if (!topic) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px] border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background">
                <DialogHeader>
                    <DialogTitle className="font-black text-2xl uppercase tracking-tighter">Edit Topic Content</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title" className="font-black uppercase text-xs">Topic Title</Label>
                        <Input
                            id="edit-title"
                            name="title"
                            defaultValue={topic.title}
                            required
                            className="border-2 border-foreground bg-background font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description" className="font-black uppercase text-xs">Description</Label>
                        <Textarea
                            id="edit-description"
                            name="description"
                            defaultValue={topic.description || ''}
                            className="border-2 border-foreground min-h-[80px] font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        />
                    </div>

                    <div className="space-y-3 bg-secondary/10 p-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Label className="font-black uppercase text-xs flex items-center gap-2">
                            <VideoIcon className="h-4 w-4" /> Video Upload
                        </Label>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="video/*"
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full border-2 border-foreground bg-yellow-400 text-foreground font-black hover:bg-yellow-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                >
                                    {uploading ? (
                                        <><Loader2 className="animate-spin mr-2 h-4 w-4" /> UPLOADING {uploadProgress}%</>
                                    ) : (
                                        <><Upload className="mr-2 h-4 w-4 stroke-[3px]" /> UPLOAD FROM COMPUTER</>
                                    )}
                                </Button>
                                {uploading && (
                                    <div className="mt-2 h-2 w-full bg-foreground/10 border border-foreground overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                                {videoUrl && !uploading && (
                                    <div className="mt-3 p-3 bg-green-50 border-2 border-green-500 rounded-lg">
                                        <p className="text-xs font-bold text-green-800">✅ Video uploaded successfully</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="font-black border-2 border-transparent hover:border-foreground"
                        >
                            CANCEL
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || uploading}
                            className="border-4 border-foreground bg-primary text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-background" />}
                            SAVE CHANGES
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
