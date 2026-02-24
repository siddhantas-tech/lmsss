import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Video,
  GripVertical,
  Trash2,
  Check,
  ChevronsUpDown,
  Settings,
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
import { createTopic, deleteTopic, getTopicsByCourse } from "@/api/topics";
import { CourseAssignmentManager } from "@/components/admin/course-assignment";
import { TopicEditDialog } from "@/components/admin/topic-edit-dialog";

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
  const [editTopic, setEditTopic] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  /* ------------------ load initial data ------------------ */
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (!id) return;
    try {
      const [catRes, labRes, courseRes, assignedLabsRes, topicsRes] = await Promise.all([
        getCategories(),
        getLabs(),
        getCourseDetails(id),
        getLabsForCourse(id),
        getTopicsByCourse(id),
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
          // Support multiple videos per topic
          const allVideos = Array.isArray(t.videos) && t.videos.length > 0
            ? t.videos
            : (t.video_url ? [{ id: t.id + '-v', url: t.video_url }] : []);
          const topicVideo = allVideos[0] || null;
          return {
            ...t,
            videoUrl: topicVideo?.url || t.video_url || "",
            videoId: topicVideo?.id || t.video_id,
            videos: allVideos,
            showVideoSection: false,
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
        course_id: id!,
        order_index: topics.length,
      });

      const newTopic = {
        ...res.data,
        videoUrl: "",
        videoId: undefined,
        videos: [],
        showVideoSection: false
      };

      setTopics([...topics, newTopic]);
    } catch (e) {
      console.error("Failed to create topic:", e);
    }
  };

  const removeTopic = async (topicId: string) => {
    if (confirm("Are you sure you want to permanently delete this topic from the server?")) {
      try {
        await deleteTopic(topicId);
        setTopics(topics.filter((t) => t.id !== topicId));
      } catch (e: any) {
        console.error("Failed to delete topic:", e);
      }
    }
  };



  const toggleLab = (labId: string) => {
    setSelectedLabs((prev) =>
      prev.includes(labId)
        ? prev.filter((id) => id !== labId)
        : [...prev, labId]
    );
  };

  const handleSave = async () => {
    if (!course.title.trim() || !course.description.trim() || !course.categoryId) {
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
      } else {
        await createCourse(payload);
      }
      navigate('/admin/courses');
    } catch (err: any) {
      console.error('Failed to save course:', err);
    } finally {
      setSubmitting(false);
    }
  };

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

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="font-black text-lg truncate">{topic.title || "Untitled Topic"}</p>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                            <Video className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black text-primary uppercase">
                              {topic.videos?.length || 0} Assets
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium uppercase truncate opacity-70">
                          {topic.description || "No description provided"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:bg-muted"
                          onClick={() => {
                            setEditTopic(topic);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
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

          <CourseAssignmentManager courseId={id!} />
        </div>

        <div className="space-y-8">
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

      <TopicEditDialog
        topic={editTopic}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          loadInitialData();
        }}
      />
    </main>
  );
}
