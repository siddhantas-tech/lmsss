import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
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

import { getCategories } from "@/api/categories";
import { createCourse } from "@/api/courses";

interface Category {
  id: string;
  name: string;
}

export default function NewCoursePage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);

  /* ------------------ load categories ------------------ */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]); // Ensure categories is always an array
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  /* ------------------ submit ------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      alert('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await createCourse({
        title: formData.title,
        description: formData.description,
        category_id: formData.category,
      });
      navigate('/admin/courses');
    } catch (err: any) {
      console.error('Failed to create course:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-2xl mx-auto px-8 py-12">
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-2">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted transition-all">
            <Link to="/admin/courses">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Assemble New Module</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">
              Curriculum Architecture & Metadata
            </p>
          </div>
        </div>

        <Card className="border-2 border-border shadow-xl rounded-3xl overflow-hidden bg-card">
          <CardHeader className="bg-muted/30 border-b pb-6">
            <CardTitle className="text-xl font-black uppercase tracking-tight">Core Configuration</CardTitle>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Define the foundational properties of this course</p>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Title */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Course Designation</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Advanced Additive Manufacturing"
                className="text-lg font-bold border-2 focus-visible:border-primary transition-all h-12 rounded-xl"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Module Abstract</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Briefly describe the learning objectives..."
                className="min-h-[120px] font-medium border-2 focus-visible:border-primary transition-all rounded-xl"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Functional Group</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                disabled={loadingCategories}
              >
                <SelectTrigger className="h-12 border-2 font-bold rounded-xl focus:border-primary transition-all">
                  <SelectValue
                    placeholder={
                      loadingCategories
                        ? "Synchronizing categories..."
                        : "Select classification"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="font-bold py-3">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="p-8 bg-muted/10 flex gap-4 border-t">
            <Button asChild variant="outline" className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-muted">
              <Link to="/admin/courses">Discard</Link>
            </Button>
            <Button type="submit" className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all hover:translate-y-[-2px] active:translate-y-0" disabled={submitting}>
              {submitting ? 'Initializing...' : 'GENERATE COURSE'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}

