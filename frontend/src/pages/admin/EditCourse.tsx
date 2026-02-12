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
import { getLabs, getLabsForCourse, assignLabToCourse } from "@/api/labs";
import { getCourseDetails, updateCourse, createCourse } from "@/api/courses";
import { createTopic } from "@/api/topics";
import { createVideo, updateVideo } from "@/api/videos";
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
    const [catRes, labRes, courseRes, assignedLabsRes] = await Promise.all([
      getCategories(),
      getLabs(),
      getCourseDetails(id!),
      getLabsForCourse(id!),
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
      // Load topics for this course if available
      if (courseRes.data.topics) {
        setTopics(courseRes.data.topics.map((t: any) => ({
          ...t,
          videoUrl: t.video_url, // Alias for UI consistency
          videoId: t.video_id,
          showVideoSection: false
        })));
      }
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

  const removeTopic = (topicId: string) => {
    // Since there's no delete API yet, we just remove it from the local list
    // In a real app, we'd need a delete endpoint.
    if (confirm("Remove topic from this session? (Note: No delete API detected)")) {
      setTopics(topics.filter((t) => t.id !== topicId));
    }
  };

  const updateTopicLocal = (id: string, patch: Record<string, any>) => {
    setTopics(topics.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const saveTopicTitle = async (topicId: string, title: string) => {
    // User mentioned there's no topic update API, so we skip this for now
    console.log("Topic title updated locally:", title);
  };

  const saveTopicVideoUrl = async (topicId: string, url: string) => {
    if (!url) return;
    updateTopicLocal(topicId, { uploading: true, uploadError: "" });
    try {
      const topic = topics.find(t => t.id === topicId);
      if (topic?.videoId) {
        await updateVideo(topic.videoId, { title: topic.title + " Video", url });
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
                    <GripVertical className="text-muted-foreground/30" />
                    <Input
                      value={topic.title}
                      className="font-bold border-2 focus-visible:ring-primary/20"
                      onChange={(e) =>
                        updateTopicLocal(topic.id, { title: e.target.value })
                      }
                      onBlur={(e) => saveTopicTitle(topic.id, e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant={topic.videoUrl ? "default" : "outline"}
                      className={cn("gap-2", topic.videoUrl ? "bg-primary text-primary-foreground" : "")}
                      onClick={() => updateTopicLocal(topic.id, { showVideoSection: !topic.showVideoSection })}
                    >
                      <Video className="h-4 w-4" />
                      {topic.videoUrl ? "VIDEO SET" : "ADD VIDEO"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setQuizTopic(topic);
                        setIsQuizBuilderOpen(true);
                      }}
                    >
                      <FileQuestion className="h-4 w-4" />
                      QUIZ
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeTopic(topic.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {topic.showVideoSection ? (
                    <div className="mt-3 rounded-md border p-4 space-y-4 bg-muted/5">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-black">Video Resource URL</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://supabase-url.mp4"
                            value={topic.videoUrl || ""}
                            onChange={(e) => updateTopicLocal(topic.id, { videoUrl: e.target.value })}
                            className="bg-background"
                          />
                          <Button
                            size="sm"
                            disabled={topic.uploading}
                            onClick={() => saveTopicVideoUrl(topic.id, topic.videoUrl)}
                          >
                            {topic.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "APPLY"}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          Direct links to MP4, YouTube, or HLS streams supported.
                        </p>
                      </div>

                      {topic.uploadError ? (
                        <div className="text-sm font-bold text-destructive">{topic.uploadError}</div>
                      ) : null}

                      {topic.videoId && (
                        <div className="flex items-center gap-2 text-xs font-black text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
                          <Check className="h-3 w-3" /> VIDEO LINKED
                        </div>
                      )}
                    </div>
                  ) : null}

                </div>
              ))}
              {topics.length === 0 && (
                <div className="py-20 border-2 border-dashed border-foreground/10 rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                  <p className="font-bold uppercase tracking-widest text-xs">No topics added yet</p>
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
