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
  Upload,
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
import { getLabs, getLabsForCourse, assignLabToCourse } from "@/api/labs";
import { getCourseDetails, updateCourse, createCourse } from "@/api/courses";
import { createTopic, updateTopic, deleteTopic, getTopicsByCourse } from "@/api/topics";
import { createVideo, updateVideo, uploadVideo } from "@/api/videos";
import { QuizBuilder } from "@/components/admin/quiz-builder";
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
  const [quizTopic, setQuizTopic] = useState<any | null>(null);
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);

  /* ------------------ load initial data ------------------ */
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [catRes, labRes, courseRes, assignedLabsRes, topicsRes] = await Promise.all([
        getCategories(),
        getLabs(),
        getCourseDetails(id!),
        getLabsForCourse(id!),
        getTopicsByCourse(id!),
      ]);

      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setLabs(Array.isArray(labRes.data) ? labRes.data : []);

      if (Array.isArray(assignedLabsRes.data)) {
        setSelectedLabs(assignedLabsRes.data.map((l: any) => l.id));
      }

      if (courseRes.data) {
        setCourse({
          title: courseRes.data.title || "",
          description: courseRes.data.description || "",
          categoryId: courseRes.data.category_id || "",
        });
      }

      if (Array.isArray(topicsRes.data)) {
        setTopics(topicsRes.data.map((t: any) => {
          const topicVideo = (Array.isArray(t.videos) && t.videos.length > 0) ? t.videos[0] : null;
          return {
            ...t,
            videoUrl: topicVideo?.url || t.video_url || "",
            videoId: topicVideo?.id || t.video_id,
            showVideoSection: false
          };
        }));
      }
    } catch (error) {
      console.error("Failed to load course data:", error);
    }
  };

  /* ------------------ topic handlers ------------------ */
  const handleAddTopic = async () => {
    try {
      const res = await createTopic({
        title: "New Topic",
        courseId: id!,
        orderIndex: topics.length,
      });

      const newTopic = {
        ...res.data,
        videoUrl: "",
        videoId: undefined,
        showVideoSection: false
      };

      setTopics([...topics, newTopic]);
    } catch (e) {
      console.error("Failed to create topic:", e);
      alert("Failed to create topic.");
    }
  };

  const removeTopic = async (topicId: string) => {
    if (confirm("Are you sure you want to permanently delete this topic from the server?")) {
      try {
        await deleteTopic(topicId);
        setTopics(topics.filter((t) => t.id !== topicId));
      } catch (e: any) {
        console.error("Failed to delete topic:", e);
        alert(e?.response?.data?.message || "Failed to delete topic from server.");
      }
    }
  };

  const updateTopicLocal = (id: string, patch: Record<string, any>) => {
    setTopics(topics.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const saveTopicTitle = async (topicId: string, title: string) => {
    if (!title.trim()) return;
    try {
      await updateTopic(topicId, { title });
    } catch (e: any) {
      console.error("Failed to update topic title on server:", e);
    }
  };

  const saveTopicVideoUrl = async (topicId: string, url: string) => {
    if (!url) return;
    updateTopicLocal(topicId, { uploading: true, uploadError: "" });
    try {
      const topic = topics.find(t => t.id === topicId);
      if (topic?.videoId) {
        await updateVideo(topic.id, { title: topic.title + " Video", url });
      } else {
        const { data: newVideo } = await createVideo({
          title: topic?.title + " Video",
          url,
          courseId: id!,
          topicId: topicId,
        });
        updateTopicLocal(topicId, { videoId: newVideo.id });
      }
      updateTopicLocal(topicId, { uploading: false, videoUrl: url });
      alert("Video URL saved!");
    } catch (e: any) {
      updateTopicLocal(topicId, {
        uploading: false,
        uploadError: e?.response?.data?.message || e?.message || "Failed to save video URL.",
      });
    }
  };

  const handleVideoFileUpload = async (topicId: string, file: File) => {
    if (!file) return;
    updateTopicLocal(topicId, { uploading: true, uploadError: "" });
    try {
      const topic = topics.find(t => t.id === topicId);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("topicId", topicId);
      formData.append("courseId", id!);
      formData.append("title", topic?.title || "Topic Video");

      const { data: result } = await uploadVideo(formData);

      updateTopicLocal(topicId, {
        uploading: false,
        videoUrl: result.url,
        videoId: result.id
      });
      alert("Video uploaded successfully!");
    } catch (e: any) {
      console.error("Upload failed:", e);
      updateTopicLocal(topicId, {
        uploading: false,
        uploadError: e?.response?.data?.message || e?.message || "Failed to upload video.",
      });
    }
  };

  // removeTopicAlias was redundant, removed.

  /* ------------------ labs ------------------ */
  const toggleLab = (labId: string) => {
    setSelectedLabs((prev) =>
      prev.includes(labId)
        ? prev.filter((id) => id !== labId)
        : [...prev, labId]
    );
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
        await assignLabToCourse(id, selectedLabs);
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
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex justify-between flex-row items-center border-b bg-muted/30 pb-4">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Curriculum</CardTitle>
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Manage your course topics and resources</p>
              </div>
              <Button size="sm" onClick={handleAddTopic} className="gap-2 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                <Plus className="h-4 w-4" /> ADD TOPIC
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {topics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className="group relative rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md dark:hover:bg-accent/5"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col items-center gap-1 text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                        <GripVertical className="h-5 w-5 cursor-grab active:cursor-grabbing" />
                        <span className="text-[10px] font-black">{index + 1}</span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <Input
                          value={topic.title}
                          className="font-bold text-lg border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
                          onChange={(e) =>
                            updateTopicLocal(topic.id, { title: e.target.value })
                          }
                          onBlur={(e) => saveTopicTitle(topic.id, e.target.value)}
                          placeholder="Untitled Topic"
                        />
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 px-2 text-[10px] font-black uppercase tracking-wider transition-all",
                              topic.videoUrl
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => updateTopicLocal(topic.id, { showVideoSection: !topic.showVideoSection })}
                          >
                            <Video className="h-3 w-3 mr-1.5" />
                            {topic.videoUrl ? "VIDEO LINKED" : "ADD VIDEO"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:bg-muted"
                            onClick={() => {
                              setQuizTopic(topic);
                              setIsQuizBuilderOpen(true);
                            }}
                          >
                            <FileQuestion className="h-3 w-3 mr-1.5" />
                            QUIZ
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => removeTopic(topic.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {topic.showVideoSection ? (
                      <div className="mt-4 rounded-lg border bg-muted/30 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Video Content URL</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="https://example.com/video.mp4"
                              value={topic.videoUrl || ""}
                              onChange={(e) => updateTopicLocal(topic.id, { videoUrl: e.target.value })}
                              className="bg-background border-2 focus-visible:border-primary transition-colors"
                            />
                            <Button
                              size="sm"
                              disabled={topic.uploading}
                              onClick={() => saveTopicVideoUrl(topic.id, topic.videoUrl)}
                              className="font-bold px-4"
                            >
                              {topic.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "APPLY"}
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium italic">
                            Paste a direct video URL (MP4, YouTube, or HLS stream)
                          </p>
                        </div>

                        {topic.uploadError ? (
                          <div className="text-xs font-bold text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">{topic.uploadError}</div>
                        ) : null}

                        {topic.videoId && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <Check className="h-3 w-3" /> ATTACHED
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {topics.length === 0 && (
                <div className="py-16 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 opacity-20" />
                  </div>
                  <p className="font-bold uppercase tracking-widest text-[10px]">No curriculum items created</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Builder Integration */}
          {quizTopic && (
            <QuizBuilder
              topic={{
                id: quizTopic.id,
                title: quizTopic.title,
                course_id: id!
              }}
              open={isQuizBuilderOpen}
              onOpenChange={setIsQuizBuilderOpen}
              onSuccess={() => {
                console.log("Quiz updated for topic:", quizTopic.id);
              }}
            />
          )}
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
