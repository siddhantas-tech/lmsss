import { useState, useEffect } from 'react';
import { getCourses } from '../api/courses';

interface Course {
    id: string;
    title: string;
    description: string;
}

export const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await getCourses();
                setCourses(Array.isArray(response.data) ? response.data : []);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch courses');
                setCourses([]); // Ensure courses is always an array
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    return { courses, loading, error };
};
