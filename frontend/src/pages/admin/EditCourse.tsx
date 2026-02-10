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
import { getCourseDetails } from "@/api/courses";
import { createCourse, updateCourse } from "@/api/courses";
import { updateVideo } from "@/api/videos";
import api from "@/api/axios";
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
    const [catRes, labRes, courseRes] = await Promise.all([
      getCategories(),
      getLabs(),
      getCourseDetails(id!),
    ]);

    setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    setLabs(Array.isArray(labRes.data) ? labRes.data : []);

    if (courseRes.data) {
      setCourse({
        title: courseRes.data.title || "",
        description: courseRes.data.description || "",
        categoryId: courseRes.data.category_id || "",
      });
      // Load topics for this course if available
      if (courseRes.data.topics) {
        setTopics(courseRes.data.topics);
      }
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
        videoId: undefined,
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
      const url = prompt("Paste the video URL (YouTube, CDN, or hosted file):");
      if (!url) {
        updateTopic(topicId, { uploading: false, uploadProgress: 0, uploadError: "Upload cancelled." });
        return;
      }

      const topic = topics.find(t => t.id === topicId);

      if (topic?.videoId) {
        // Update existing video via PUT /api/video/:id
        await updateVideo(topic.videoId, { title: file.name, url });
      } else {
        // Create new video record (assuming POST /video returns the new record)
        const { data: newVideo } = await api.post("/video", {
          title: file.name,
          url,
          courseId: id!,
        });
        updateTopic(topicId, { videoId: newVideo.id });
      }

      updateTopic(topicId, {
        uploading: false,
        uploadProgress: 100,
        videoUrl: url,
        videoFileName: file.name,
        uploadError: "",
      });
    } catch (e: any) {
      updateTopic(topicId, {
        uploading: false,
        uploadProgress: 0,
        uploadError: e?.response?.data?.message || e?.message || "Failed to save video URL.",
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

  const saveTopicsToBackend = async (topics: any[]) => {
    try {
      await api.put(`/courses/${id}/topics`, { topics });
      console.log('Topics saved to backend');
    } catch (e: any) {
      console.error('Failed to save topics:', e);
    }
  };

  const handleSave = async () => {
    if (!course.title.trim() || !course.description.trim() || !course.categoryId) {
      alert('Please fill all course fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: course.title,
        description: course.description,
        category_id: course.categoryId,
      };

      if (id) {
        await updateCourse(id, payload);
        await saveTopicsToBackend(topics);
        alert('Course updated successfully.');
      } else {
        await createCourse(payload);
        alert('Course created successfully.');
      }
      navigate('/admin/courses');
    } catch (err: any) {
      console.error('Failed to save course:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to save course');
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
