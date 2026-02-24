import api from "./axios";

export const getTopicsByCourse = (courseId: string) =>
    api.get(`/topics/course/${courseId}`);

export const createTopic = (data: { title: string; course_id: string; order_index: number }) =>
    api.post("/topics", data);

export const updateTopic = (id: string, data: { title?: string; description?: string; order_index?: number }) =>
    api.put(`/topics/${id}`, data);

export const deleteTopic = (id: string) =>
    api.delete(`/topics/${id}`);

export const uploadAssignment = (formData: FormData) =>
    api.post("/topics/assignment", formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
