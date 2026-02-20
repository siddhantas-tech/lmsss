import api from "./axios";

export const getQuestions = (params: { topicId?: string; courseId?: string }) =>
  api.get("/quiz", { params });

export const createQuestion = (data: any) =>
  api.post("/quiz", data);

export const updateQuestion = (id: string, data: any) =>
  api.put(`/quiz/${id}`, data);

export const deleteQuestion = (id: string) =>
  api.delete(`/quiz/${id}`);

// User side
export const getQuizByTopic = (topicId: string) =>
  api.get(`/quiz/topic/${topicId}`);

export const submitQuiz = (data: { topic_id?: string; course_id?: string; answers: any[] }) =>
  api.post("/quiz/submit", data);
