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
  videos?: {
    id: string
    title: string
    video_path: string
  } | null
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
    const fetchTopicAndQuizzes = async () => {
      setLoading(true)
      try {
        if (!courseId) return

        try {
          const enrollmentsRes = await getMyEnrollments()
          const isEnrolled =
            Array.isArray(enrollmentsRes.data) &&
            enrollmentsRes.data.some((e: any) => e.course_id === courseId)

          if (!isEnrolled) {
            await enrollCourse(courseId)
          }
        } catch {
          // intentionally ignored
        }

        const courseRes = await fetchCourseDetails(courseId)
        const topicsRes = await getTopicsByCourse(courseId)

        if (courseRes.data) {
          setCourse({
            title: courseRes.data.title || 'Untitled Course',
            description: courseRes.data.description || '',
          })
        }

        const topicsRaw = Array.isArray(topicsRes.data) ? topicsRes.data : []

        const mappedTopics: Topic[] = await Promise.all(
          topicsRaw.map(async (topic: any, idx: number) => {
            let questions: QuizQuestion[] = []

            try {
              const quizRes = await getQuizByTopic(topic.id)
              const quizData = Array.isArray(quizRes.data?.questions)
                ? quizRes.data.questions
                : []

              questions = quizData.map((q: any) => ({
                id: q.id,
                question: q.question_text,
                options: Array.isArray(q.options)
                  ? q.options.map((opt: any) => ({
                      id: opt.id,
                      text: opt.option_text,
                    }))
                  : [],
                correctAnswerIndex: Array.isArray(q.options)
                  ? q.options.findIndex((opt: any) => opt.is_correct)
                  : 0,
              }))
            } catch {}

            return {
              id: topic.id,
              title: topic.title,
              duration: 0,
              completed: false,
              isLocked: idx !== 0,
              description: topic.description || '',
              course_id: topic.course_id || courseId,
              questions,
              videos: topic.videos ?? null,
            }
          })
        )

        setTopics(mappedTopics)
        setCurrentTopicId(mappedTopics.length > 0 ? mappedTopics[0].id : null)
      } catch (err: any) {
        setError(err.message || 'Failed to load topics')
      } finally {
        setLoading(false)
      }
    }

    fetchTopicAndQuizzes()
  }, [courseId])

  const currentTopic = topics.find(t => t.id === currentTopicId)

  // ✅ THE ACTUAL FIX
  const hasVideo =
    !!currentTopic &&
    typeof currentTopic.videos?.video_path === 'string'

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const enforcePlaybackRate = () => {
      if (video.playbackRate !== 1) video.playbackRate = 1
    }

    const preventSeek = () => {
      if (video.currentTime > maxTimeWatched.current) {
        video.currentTime = maxTimeWatched.current
      }
    }

    video.addEventListener('ratechange', enforcePlaybackRate)
    video.addEventListener('seeking', preventSeek)

    return () => {
      video.removeEventListener('ratechange', enforcePlaybackRate)
      video.removeEventListener('seeking', preventSeek)
    }
  }, [currentTopicId])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      maxTimeWatched.current = Math.max(
        maxTimeWatched.current,
        videoRef.current.currentTime
      )
    }
  }

  const handleVideoError = () => {
    setVideoError('Unable to load video for this topic.')
  }

  const handleVideoEnd = () => {
    if (currentTopic?.questions.length) {
      setIsQuizOpen(true)
    } else {
      setShowQuizPrompt(true)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 font-bold">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
          {currentTopic && hasVideo ? (
            <video
              key={currentTopic.id}
              ref={videoRef}
              src={`https://learning-management-system-be.onrender.com/api/video?topicId=${currentTopic.id}`}
              controls
              onEnded={handleVideoEnd}
              onTimeUpdate={handleTimeUpdate}
              onError={handleVideoError}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
            />
          ) : (
            <div className="text-white/60 text-center">
              <Lock className="mx-auto h-12 w-12 mb-3" />
              <p className="font-bold">No video uploaded for this topic</p>
            </div>
          )}
        </div>
      </div>

      {currentTopic && (
        <TopicQuizModal
          isOpen={isQuizOpen}
          topicTitle={currentTopic.title}
          questions={currentTopic.questions}
          onClose={() => setIsQuizOpen(false)}
          onSubmit={() => {}}
        />
      )}
    </div>
  )
}