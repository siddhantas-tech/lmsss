import api from "./axios";

export const getTopicsByCourse = (courseId: string) =>
    api.get(`/topics/course/${courseId}`);

export const createTopic = (data: { title: string; courseId: string; orderIndex: number }) =>
    api.post("/topics", data);

export const updateTopic = (id: string, data: { title?: string; orderIndex?: number }) =>
    api.put(`/topics/${id}`, data);

export const deleteTopic = (id: string) =>
    api.delete(`/topics/${id}`);
