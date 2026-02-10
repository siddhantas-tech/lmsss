import api from "./axios";

// User
export const getQuizByTopic = (topicId: string) =>
  api.get(`/quiz/topic/${topicId}`);

export const submitQuiz = (payload: any) =>
  api.post("/quiz/submit", payload);

export const getMyAttempts = () =>
  api.get("/quiz/my-attempts");

// Admin
export const getQuizQuestions = (params: any) =>
  api.get("/quiz/admin", { params });

export const createQuizQuestion = (data: any) =>
  api.post("/quiz/admin", data);

export const updateQuizQuestion = (id: string, data: any) =>
  api.put(`/quiz/admin/${id}`, data);

export const deleteQuizQuestion = (id: string) =>
  api.delete(`/quiz/admin/${id}`);
