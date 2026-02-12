import api from "./axios";

export const createTopic = (data: { title: string; courseId: string; orderIndex: number }) =>
    api.post("/topics", data);
