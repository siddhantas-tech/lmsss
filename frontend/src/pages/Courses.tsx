import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getCourses } from "@/api/courses";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  categories?: {
    name: string;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        console.log('Fetching courses...');
        const res = await getCourses();
        console.log('Courses API response:', res);
        console.log('Courses data:', res.data);
        if (Array.isArray(res.data)) {
          console.log('Setting courses:', res.data.length);
          setCourses(res.data);
        } else {
          console.error('Courses data is not an array:', res.data);
          setCourses([]);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
        setCourses([]); // Ensure courses is always an array
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  return (
    <div className="bg-background">
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-7xl font-black tracking-tight uppercase">
              Training Catalog
            </h1>
            <p className="text-xl font-bold text-muted-foreground max-w-2xl leading-relaxed">
              Master experimental manufacturing and design with our certified courses.
            </p>
          </div>

          {loading ? (
            <div className="text-center font-black uppercase tracking-widest text-muted-foreground py-20">
              Loading courses…
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2"
                >
                  <div className="aspect-video relative bg-muted/20 border-b-4 border-foreground">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {course.categories?.name && (
                      <div className="absolute top-4 left-4">
                        <span className="px-4 py-2 bg-background border-4 border-foreground text-xs font-black uppercase rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          {course.categories.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-10">
                    <div className="mb-8">
                      <h3 className="text-3xl font-black mb-4 leading-tight group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-lg font-bold text-muted-foreground italic line-clamp-2 leading-relaxed">
                        “{course.description}”
                      </p>
                    </div>

                    <Button
                      asChild
                      className="w-full h-16 rounded-2xl font-black text-lg border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    >
                      <Link to={`/courses/${course.id}`}>
                        Start Learning <ArrowRight className="ml-2 h-6 w-6" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
