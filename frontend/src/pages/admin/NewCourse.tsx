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
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin/courses">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase">Create New Course</h1>
            <p className="text-xs uppercase text-muted-foreground">
              Add a new curriculum module
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label>Course Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                disabled={loadingCategories}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingCategories
                        ? "Loading categories..."
                        : "Select a category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/admin/courses">Cancel</Link>
            </Button>
            <Button type="submit" className="flex-[2]" disabled={submitting}>
              {submitting ? 'Creating...' : 'CREATE COURSE'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}

