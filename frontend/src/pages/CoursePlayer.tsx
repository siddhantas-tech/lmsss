import { useState, useRef, useEffect } from 'react'
import { Play, CheckCircle, Clock, Lock, ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getQuizByTopic } from '@/api/quiz'
import { getCourseDetails as fetchCourseDetails } from '@/api/courses'
import { TopicQuizModal } from '@/components/course/topic-quiz-modal'
import { getTopicsByCourse } from '@/api/topics'

interface Topic {
  id: string
  title: string
  duration: number
  completed: boolean
  isLocked: boolean
  description: string
  course_id: string
  questions: any[]
  videos?: {
    id: string
    title: string
    video_path: string
  } | null
}

export default function CoursePlayerPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const [topics, setTopics] = useState<Topic[]>([])
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const maxTimeWatched = useRef(0)

  useEffect(() => {
    const load = async () => {
      if (!courseId) return

      const topicsRes = await getTopicsByCourse(courseId)
      console.log('📦 RAW TOPICS FROM API:', topicsRes.data)

      const mapped = topicsRes.data.map((topic: any, idx: number) => {
        console.log(`🎯 Mapping topic ${topic.id}`, topic)
        console.log('🎥 topic.videos:', topic.videos)

        return {
          ...topic,
          duration: 0,
          completed: false,
          isLocked: idx !== 0,
          videos: topic.videos ?? null,
        }
      })

      setTopics(mapped)
      setCurrentTopicId(mapped[0]?.id ?? null)
    }

    load()
  }, [courseId])

  const currentTopic = topics.find(t => t.id === currentTopicId)

  const hasVideo =
    !!currentTopic &&
    typeof currentTopic.videos?.video_path === 'string'

  console.log('▶️ CURRENT TOPIC:', currentTopic)
  console.log('✅ HAS VIDEO?', hasVideo)
  console.log(
    '📂 VIDEO PATH:',
    currentTopic?.videos?.video_path ?? 'NONE'
  )

  const videoUrl = currentTopic
    ? `https://learning-management-system-be.onrender.com/api/video?topicId=${currentTopic.id}`
    : ''

  console.log('🌐 VIDEO STREAM URL:', videoUrl)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onError = () => {
      console.error('❌ VIDEO ELEMENT ERROR', {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src,
      })
      setVideoError('Video failed to load')
    }

    video.addEventListener('error', onError)
    return () => video.removeEventListener('error', onError)
  }, [currentTopicId])

  return (
    <div className="p-10">
      <div className="aspect-video bg-black flex items-center justify-center">
        {currentTopic && hasVideo ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            onTimeUpdate={() => {
              if (videoRef.current) {
                maxTimeWatched.current = Math.max(
                  maxTimeWatched.current,
                  videoRef.current.currentTime
                )
              }
            }}
          />
        ) : (
          <div className="text-white/70 text-center">
            <Lock className="mx-auto mb-3" />
            No video for this topic
          </div>
        )}
      </div>

      {videoError && (
        <p className="text-red-500 font-bold mt-4">
          {videoError}
        </p>
      )}
    </div>
  )
}