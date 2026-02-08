import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCategories } from "@/api/categories";
import { getCourses } from "@/api/courses";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category_id: string;
}

export default function CategoryDetailPage() {
  const { slug } = useParams();

  const [category, setCategory] = useState<Category | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoryRes = await getCategories();
        const categories = Array.isArray(categoryRes.data) ? categoryRes.data : [];
        const foundCategory = categories.find(
          (c: Category) => c.slug === slug
        );

        if (!foundCategory) {
          setCategory(null);
          setCourses([]);
          return;
        }

        setCategory(foundCategory);

        const coursesRes = await getCourses();
        const courses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
        const filteredCourses = courses.filter(
          (course: Course) => course.category_id === foundCategory.id
        );

        setCourses(filteredCourses);
      } catch (error) {
        console.error('Failed to load category details:', error);
        setCategory(null);
        setCourses([]); // Ensure courses is always an array
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-muted-foreground">
        Loading category…
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black mb-6 uppercase">
          Category not found
        </h1>
        <Button
          asChild
          className="h-14 px-8 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl"
        >
          <Link to="/categories">Back to Knowledge Areas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b-4 border-foreground py-20">
        <div className="max-w-7xl mx-auto px-6">
          <Button
            variant="ghost"
            asChild
            className="mb-10 -ml-4 font-black hover:bg-muted rounded-xl uppercase tracking-tighter"
          >
            <Link to="/categories">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
            </Link>
          </Button>

          <h1 className="text-5xl sm:text-8xl font-black mb-8 uppercase tracking-tighter underline decoration-primary underline-offset-[12px]">
            {category.name}
          </h1>

          <p className="text-2xl text-muted-foreground max-w-3xl font-bold italic leading-relaxed">
            “{category.description}”
          </p>
        </div>
      </div>

      {/* Courses */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="aspect-video bg-muted/20 border-b-4 border-foreground">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col p-10">
                  <div className="mb-8">
                    <h3 className="text-3xl font-black mb-4 uppercase group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-lg font-bold text-muted-foreground italic line-clamp-2">
                      “{course.description}”
                    </p>
                  </div>

                  <Button
                    asChild
                    className="w-full h-16 rounded-2xl font-black text-lg border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    <Link to={`/courses/${course.id}`}>
                      Start Session <ArrowRight className="ml-2 h-6 w-6" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border-4 border-dashed border-muted rounded-[3rem]">
              <p className="text-3xl font-black text-muted-foreground italic uppercase tracking-widest opacity-50">
                No Active Courses Found
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
