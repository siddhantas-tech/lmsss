import { useEffect, useState } from "react";
import { Plus, Layers, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/categories";

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  /* ----------------------------------
     Load categories from backend
  ---------------------------------- */
  const fetchCategories = async () => {
    const res = await getCategories();
    setCategories(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ----------------------------------
     Handlers
  ---------------------------------- */
  const handleOpenDialog = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description,
    });
    setEditingId(category.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    fetchCategories();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateCategory(editingId, formData);
    } else {
      await createCategory(formData);
    }

    fetchCategories();
    setIsDialogOpen(false);
  };

  /* ----------------------------------
     UI
  ---------------------------------- */
  return (
    <main className="w-full max-w-7xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
            Categories
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">
            Sector Classification
          </p>
        </div>
        <Button
          onClick={handleOpenDialog}
          className="h-12 px-6 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-foreground bg-primary text-primary-foreground hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> ADD NEW CATEGORY
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="group border-2 border-foreground rounded-3xl bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden"
          >
            <CardHeader className="p-6 pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center border-2 border-purple-500/20">
                  <Layers className="h-5 w-5 text-purple-500" />
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                    className="h-8 w-8 hover:bg-muted rounded-full"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-full"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <CardTitle className="mt-4 text-lg font-black uppercase tracking-tight leading-tight">
                {category.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 pt-2 pb-6 flex-1">
              <p className="text-sm font-medium text-muted-foreground line-clamp-3 leading-relaxed">
                {category.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full h-64 border-2 border-dashed border-foreground/20 rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <Layers className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">
              No Categories Configured
            </p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0 gap-0 overflow-hidden bg-background rounded-3xl">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingId ? "Edit Category" : "Create Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="px-8 pb-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Category Name
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl">
                {editingId ? "SAVE CHANGES" : "CREATE CATEGORY"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
