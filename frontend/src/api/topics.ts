import api from "./axios";

export const createTopic = (data: { title: string; courseId: string; orderIndex: number }) =>
    api.post("/topics", data);

export const updateTopic = (id: string, data: any) =>
    api.put(`/topics/${id}`, data);

export const deleteTopic = (id: string) =>
    api.delete(`/topics/${id}`);
