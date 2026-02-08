import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Video,
  FileQuestion,
  GripVertical,
  Trash2,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { getCategories } from "@/api/categories";
import { getLabs } from "@/api/labs";
import { getCourseById } from "@/api/courses";
import { createLesson, getLessonsByCourse } from "@/api/lessons";
import api from "@/api/axios";
import { supabase } from "@/lib/supabaseClient";
// import { updateCourse } from "@/api/courses.api"; // wire later

interface Category {
  id: string;
  name: string;
}

interface Lab {
  id: string;
  name: string;
  code: string;
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ------------------ data ------------------ */
  const [categories, setCategories] = useState<Category[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  const [course, setCourse] = useState({
    title: "",
    description: "",
    categoryId: "",
  });

  const [topics, setTopics] = useState<any[]>([]);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [labOpen, setLabOpen] = useState(false);

  /* ------------------ load initial data ------------------ */
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [catRes, labRes, courseRes, lessonsRes] = await Promise.all([
      getCategories(),
      getLabs(),
      getCourseById(id!),
      getLessonsByCourse(id!),
    ]);

    setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    setLabs(Array.isArray(labRes.data) ? labRes.data : []);

    if (courseRes.data) {
      setCourse({
        title: courseRes.data.title || "",
        description: courseRes.data.description || "",
        categoryId: courseRes.data.category_id || "",
      });
    }

    if (lessonsRes.data && Array.isArray(lessonsRes.data)) {
      const mappedTopics = lessonsRes.data.map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        video: !!l.video_url, // Show video UI if URL exists
        quiz: false, // Default closed
        videoUrl: l.video_url || "",
        duration: l.video_duration_seconds || 0, // Map backend column
        quizDraftQuestion: "",
        quizDraftOptions: ["", "", "", ""],
        quizDraftCorrectIndex: 0,
        quizQuestions: [], // TODO: Load quizzes if needed
        uploading: false,
      }));
      setTopics(mappedTopics);
    }
  };

  /* ------------------ topic handlers ------------------ */
  const handleAddTopic = () => {
    setTopics([
      ...topics,
      {
        id: Date.now(),
        title: "New Topic",
        video: false,
        quiz: false,
        videoUrl: "",
        quizDraftQuestion: "",
        quizDraftOptions: ["", "", "", ""],
        quizDraftCorrectIndex: 0,
        quizQuestions: [],
      },
    ]);
  };

  const toggleTopicItem = (id: number, type: "video" | "quiz") => {
    setTopics(
      topics.map((t) =>
        t.id === id ? { ...t, [type]: !t[type] } : t
      )
    );
  };

  const updateTopic = (id: number, patch: Record<string, any>) => {
    setTopics(topics.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addQuizQuestion = (id: number) => {
    const topic = topics.find((t) => t.id === id);
    if (!topic) return;

    const questionText = (topic.quizDraftQuestion || "").trim();
    const options = Array.isArray(topic.quizDraftOptions) ? topic.quizDraftOptions : [];
    const correctIndexRaw = Number(topic.quizDraftCorrectIndex);
    const cleanedOptionsWithIndex = options
      .map((o: string, idx: number) => ({ text: (o || "").trim(), idx }))
      .filter((o: { text: string; idx: number }) => Boolean(o.text));

    if (!questionText || cleanedOptionsWithIndex.length < 2) return;

    const correctIdxInCleaned = cleanedOptionsWithIndex.findIndex(
      (o: { text: string; idx: number }) => o.idx === correctIndexRaw
    );

    if (correctIdxInCleaned < 0) return;

    const cleanedOptions = cleanedOptionsWithIndex.map((o: { text: string; idx: number }) => o.text);

    const next = {
      id: Date.now(),
      text: questionText,
      options: cleanedOptions,
      correctIndex: correctIdxInCleaned,
    };

    updateTopic(id, {
      quizQuestions: [...(topic.quizQuestions || []), next],
      quizDraftQuestion: "",
      quizDraftOptions: ["", "", "", ""],
      quizDraftCorrectIndex: 0,
    });
  };

  const handleTopicVideoUpload = async (topicId: number, file: File) => {
    updateTopic(topicId, { uploading: true, uploadProgress: 0, uploadError: "" });
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${id}/${fileName}`; // Organize by course ID

      const { error: uploadError } = await supabase.storage
        .from('videos') // Assumed bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error("Failed to get public URL");

      // 3. Send Metadata to Backend (JSON)
      // Using relative URL to leverage Vite proxy and Axios baseURL (/api)
      const metadataUrl = "/video";
      console.log("Sending metadata to:", metadataUrl);

      // COMMENTED OUT: This creates a duplicate topic in the Express backend.
      // We will let handleSave create the topic with full details in the Main Backend.
      /*
      await api.post(metadataUrl, {
        title: file.name,
        url: publicUrl,
        courseId: id!,
      });
      */

      updateTopic(topicId, {
        uploading: false,
        uploadProgress: 100,
        videoUrl: publicUrl,
        videoFileName: file.name,
        uploadError: "",
      });
    } catch (e: any) {
      console.error("Upload Metadata Error:", e);
      if (e.config) {
        console.error("Failed URL:", e.config.url, "Base:", e.config.baseURL);
      }
      if (e.response) {
        console.error("Response Status:", e.response.status);
      }


      const errorMsg = `Upload failed: ${e?.response?.status} - ${JSON.stringify(e?.response?.data) || e.message}`;
      updateTopic(topicId, {
        uploading: false,
        uploadProgress: 0,
        uploadError: errorMsg,
      });
    }
  };

  const removeTopic = (id: number) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  /* ------------------ labs ------------------ */
  const toggleLab = (labId: string) => {
    setSelectedLabs((prev) =>
      prev.includes(labId)
        ? prev.filter((id) => id !== labId)
        : [...prev, labId]
    );
  };

  const handleSave = async () => {
    // If we are editing, we usually want to update. 
    // But since the backend apparently lacks a PUT endpoint for courses (per comments), 
    // we should NOT create a new course as that duplicates data and disconnects the videos we just uploaded.

    // For now, we'll assume the user is done linking videos/labs.
    // We can't update title/description/category without a backend endpoint.

    // We can't update course details (title/desc) due to backend limitation, 
    // but we MUST save the lessons/topics we created.

    setSubmitting(true);
    try {
      // 1. Save all topics as lessons
      const lessonPromises = topics.map(topic => {
        // Only save if it's a new topic (we assume it is if id is number/Date.now(), 
        // though ideally we'd track 'isNew'). 
        // For this fix, we'll try to save all that look like they have content.

        // Prepare payload matches what backend likely expects for a lesson
        const payload = {
          course_id: id,
          title: topic.title,
          description: topic.description || "",
          video_url: topic.videoUrl || "",
          duration: topic.duration || 0,
          id: typeof topic.id === 'string' ? topic.id : undefined, // Include ID for updates
        };

        return createLesson(payload);
      });

      await Promise.all(lessonPromises);

      alert('Topics and videos saved successfully!');
      navigate('/admin/courses');
    } catch (err: any) {
      console.error('Failed to save topics:', err);
      if (err.config) {
        console.error("Failed URL:", err.config.url);
      }
      alert(`Save Failed: ${err?.response?.status} - ${JSON.stringify(err?.response?.data) || err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <main className="w-full max-w-7xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/courses">
            <ArrowLeft />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-black uppercase">Edit Course</h1>
          <p className="text-xs uppercase text-muted-foreground">
            Curriculum & Configuration
          </p>
        </div>

        <div className="ml-auto">
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : 'SAVE CHANGES'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course */}
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={course.title}
                onChange={(e) =>
                  setCourse({ ...course, title: e.target.value })
                }
                placeholder="Course title"
              />
              <Textarea
                value={course.description}
                onChange={(e) =>
                  setCourse({ ...course, description: e.target.value })
                }
                placeholder="Description"
              />
            </CardContent>
          </Card>

          {/* Topics */}
          <Card>
            <CardHeader className="flex justify-between flex-row">
              <CardTitle>Topics</CardTitle>
              <Button size="sm" onClick={handleAddTopic}>
                <Plus className="h-3 w-3 mr-1" /> Add Topic
              </Button>
            </CardHeader>
            <CardContent>
              {topics.map((topic) => (
                <div key={topic.id} className="mb-3">
                  <div className="flex gap-3 items-center">
                    <GripVertical />
                    <Input
                      value={topic.title}
                      onChange={(e) =>
                        setTopics(
                          topics.map((t) =>
                            t.id === topic.id
                              ? { ...t, title: e.target.value }
                              : t
                          )
                        )
                      }
                    />
                    <Button
                      size="sm"
                      variant={topic.video ? "default" : "outline"}
                      onClick={() => toggleTopicItem(topic.id, "video")}
                    >
                      <Video />
                    </Button>
                    <Button
                      size="sm"
                      variant={topic.quiz ? "default" : "outline"}
                      onClick={() => toggleTopicItem(topic.id, "quiz")}
                    >
                      <FileQuestion />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeTopic(topic.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {topic.video ? (
                    <div className="mt-3 rounded-md border p-4 space-y-3">
                      <div className="space-y-2">
                        <Label>Upload Video</Label>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handleTopicVideoUpload(topic.id, file);
                          }}
                        />
                      </div>

                      {topic.uploading ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading {topic.uploadProgress || 0}%
                          </div>
                          <div className="h-2 w-full bg-foreground/10 border border-foreground overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${topic.uploadProgress || 0}%` }}
                            />
                          </div>
                        </div>
                      ) : null}

                      {topic.uploadError ? (
                        <div className="text-sm font-bold text-destructive">{topic.uploadError}</div>
                      ) : null}

                      {topic.videoUrl && !topic.uploading ? (
                        <div className="text-sm font-bold">Uploaded: {topic.videoFileName || "video"}</div>
                      ) : null}
                    </div>
                  ) : null}

                  {topic.quiz ? (
                    <div className="mt-3 rounded-md border p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>New Question</Label>
                        <Input
                          value={topic.quizDraftQuestion || ""}
                          onChange={(e) =>
                            updateTopic(topic.id, { quizDraftQuestion: e.target.value })
                          }
                          placeholder="Question text"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Options (select correct)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(Array.isArray(topic.quizDraftOptions)
                            ? topic.quizDraftOptions
                            : ["", "", "", ""]).map((opt: string, idx: number) => {
                              const isCorrect = Number(topic.quizDraftCorrectIndex || 0) === idx;

                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md border p-2",
                                    isCorrect ? "border-green-600 bg-green-50" : ""
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${topic.id}`}
                                    checked={isCorrect}
                                    onChange={() =>
                                      updateTopic(topic.id, { quizDraftCorrectIndex: idx })
                                    }
                                  />
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const next = Array.isArray(topic.quizDraftOptions)
                                        ? [...topic.quizDraftOptions]
                                        : ["", "", "", ""];
                                      next[idx] = e.target.value;
                                      updateTopic(topic.id, { quizDraftOptions: next });
                                    }}
                                    placeholder={`Option ${idx + 1}`}
                                    className={cn(isCorrect ? "border-green-600" : "")}
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          onClick={() => addQuizQuestion(topic.id)}
                          disabled={
                            !(topic.quizDraftQuestion || "").trim() ||
                            (Array.isArray(topic.quizDraftOptions)
                              ? topic.quizDraftOptions.filter((o: string) => (o || "").trim()).length
                              : 0) < 2
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Question
                        </Button>
                      </div>

                      {Array.isArray(topic.quizQuestions) && topic.quizQuestions.length ? (
                        <div className="space-y-3">
                          {topic.quizQuestions.map((q: any) => (
                            <div key={q.id} className="rounded-md border p-3">
                              <div className="font-bold">{q.text}</div>
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(Array.isArray(q.options) ? q.options : []).map((o: string, i: number) => {
                                  const isCorrect = Number(q.correctIndex) === i;
                                  return (
                                    <div
                                      key={i}
                                      className={cn(
                                        "text-sm rounded-md border px-2 py-1",
                                        isCorrect ? "border-green-600 bg-green-50 font-bold" : ""
                                      )}
                                    >
                                      {o}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-8">
          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={course.categoryId}
                onValueChange={(val) =>
                  setCourse({ ...course, categoryId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Labs */}
          <Card>
            <CardHeader>
              <CardTitle>Labs</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={labOpen} onOpenChange={setLabOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {selectedLabs.length
                      ? `${selectedLabs.length} labs selected`
                      : "Select labs"}
                    <ChevronsUpDown className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Command>
                    <CommandInput placeholder="Search labs" />
                    <CommandList>
                      <CommandGroup>
                        {labs.map((lab) => (
                          <CommandItem
                            key={lab.id}
                            onSelect={() => toggleLab(lab.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLabs.includes(lab.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {lab.name}
                            <span className="ml-auto text-xs">{lab.code}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandEmpty>No labs found</CommandEmpty>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex flex-wrap gap-2 mt-3">
                {selectedLabs.map((id) => {
                  const lab = labs.find((l) => l.id === id);
                  if (!lab) return null;
                  return (
                    <Badge key={id}>
                      {lab.code}
                      <Trash2
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => toggleLab(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
