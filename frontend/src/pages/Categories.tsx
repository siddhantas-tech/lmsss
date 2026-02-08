import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Folder } from "lucide-react";
import { getCategories } from "@/api/categories";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  courseCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]); // Ensure categories is always an array
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-16 space-y-4">
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight uppercase">
            Knowledge Areas
          </h1>
          <p className="text-muted-foreground text-xl font-bold max-w-2xl leading-relaxed">
            Explore our specialized manufacturing training catalogs and workshops.
          </p>
        </div>

        {loading ? (
          <div className="text-center font-black uppercase tracking-widest text-muted-foreground">
            Loading categories…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className="group relative bg-card border-4 border-foreground rounded-[2.5rem] p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl border-4 border-primary/20 flex items-center justify-center">
                    <Folder className="h-8 w-8 text-primary" />
                  </div>

                  <span className="font-black text-xs bg-muted border-4 border-foreground px-4 py-2 rounded-full uppercase tracking-widest">
                    {category.courseCount} Courses
                  </span>
                </div>

                <h3 className="text-3xl font-black mb-4 uppercase group-hover:text-primary transition-colors">
                  {category.name}
                </h3>

                <p className="text-muted-foreground font-bold leading-relaxed text-lg italic">
                  “{category.description}”
                </p>

                <div className="mt-8 text-primary font-black uppercase text-sm tracking-widest group-hover:underline">
                  Explore Sector →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
