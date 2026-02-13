import { useState, useRef, useEffect } from 'react'
import { Play, CheckCircle, Clock, Lock, ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getQuizByTopic, submitQuiz } from '@/api/quiz'
import { getCourseDetails as fetchCourseDetails } from '@/api/courses'
import { TopicQuizModal } from '@/components/course/topic-quiz-modal'
import { enrollCourse, getMyEnrollments } from '@/api/enrollments'
import { getTopicsByCourse } from '@/api/topics'

interface Topic {
  id: string
  title: string
  duration: number
  completed: boolean
  isLocked: boolean
  description: string
  course_id: string
  questions: QuizQuestion[]
  videoUrl?: string // 🔧 added (do not remove)
}

interface QuizOption {
  id: string
  text: string
}

interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
  correctAnswerIndex: number
}

export default function CoursePlayerPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const [course, setCourse] = useState<{ title: string; description: string } | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null)
  const [showQuizPrompt, setShowQuizPrompt] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const maxTimeWatched = useRef(0)

  useEffect(() => {
    maxTimeWatched.current = 0
    setVideoError(null)
  }, [currentTopicId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!courseId) return

        try {
          const enrollments = await getMyEnrollments()
          const enrolled = enrollments.data?.some((e: any) => e.course_id === courseId)
          if (!enrolled) await enrollCourse(courseId)
        } catch {}

        const courseRes = await fetchCourseDetails(courseId)
        const topicsRes = await getTopicsByCourse(courseId)

        setCourse({
          title: courseRes.data?.title ?? 'Untitled Course',
          description: courseRes.data?.description ?? '',
        })

        const mapped = await Promise.all(
          (topicsRes.data ?? []).map(async (topic: any, idx: number) => {
            let questions: QuizQuestion[] = []

            try {
              const quiz = await getQuizByTopic(topic.id)
              questions =
                quiz.data?.questions?.map((q: any) => ({
                  id: q.id,
                  question: q.question_text,
                  options: q.options.map((o: any) => ({
                    id: o.id,
                    text: o.option_text,
                  })),
                  correctAnswerIndex: q.options.findIndex((o: any) => o.is_correct),
                })) ?? []
            } catch {}

            const topicVideo = topic.videos ?? null

            return {
              id: topic.id,
              title: topic.title,
              duration: topicVideo?.duration ?? 0,
              completed: false,
              isLocked: idx !== 0,
              description: topic.description ?? '',
              course_id: topic.course_id ?? courseId,
              questions,
              videoUrl: topicVideo?.video_path ?? undefined, // 🔧 keep but optional
            }
          })
        )

        setTopics(mapped)
        setCurrentTopicId(mapped[0]?.id ?? null)
      } catch (err: any) {
        setError(err.message || 'Failed to load course')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  const currentTopic = topics.find(t => t.id === currentTopicId)
  const hasVideo = !!currentTopic // 🔧 single source of truth

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const enforceRate = () => (video.playbackRate = 1)
    const preventSeek = () => {
      if (video.currentTime > maxTimeWatched.current) {
        video.currentTime = maxTimeWatched.current
      }
    }

    video.addEventListener('ratechange', enforceRate)
    video.addEventListener('seeking', preventSeek)

    return () => {
      video.removeEventListener('ratechange', enforceRate)
      video.removeEventListener('seeking', preventSeek)
    }
  }, [currentTopicId])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="bg-background min-h-screen">
      <div className="aspect-video bg-black flex items-center justify-center">
        {hasVideo ? (
          videoError ? (
            <div className="text-white">{videoError}</div>
          ) : (
            <video
              ref={videoRef}
              key={currentTopic!.id}
              src={`/api/video?topicId=${currentTopic!.id}`}
              controls
              onTimeUpdate={() => {
                if (videoRef.current)
                  maxTimeWatched.current = Math.max(
                    maxTimeWatched.current,
                    videoRef.current.currentTime
                  )
              }}
              onError={() => setVideoError('Video not available')}
              className="w-full h-full"
            />
          )
        ) : (
          <div className="text-white flex flex-col items-center gap-3">
            <Lock size={48} />
            Select a topic
          </div>
        )}
      </div>

      {currentTopic && (
        <TopicQuizModal
          isOpen={isQuizOpen}
          topicTitle={currentTopic.title}
          questions={currentTopic.questions}
          onClose={() => setIsQuizOpen(false)}
          onSubmit={() => setIsQuizOpen(false)}
        />
      )}
    </div>
  )
}