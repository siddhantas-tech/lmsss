import api from "./axios";

// Admin quiz endpoints
export const getQuestions = (params: { courseId?: string; topicId?: string }) =>
  api.get("/api/admin/quiz", { params });

export const createQuestion = (data: any) =>
  api.post("/api/admin/quiz", data);

export const updateQuestion = (id: string, data: any) =>
  api.put(`/api/admin/quiz/${id}`, data);

export const deleteQuestion = (id: string) =>
  api.delete(`/api/admin/quiz/${id}`);

// User side
export const getQuizByTopic = (topicId: string) =>
  api.get(`/api/quiz/topic/${topicId}`);

export const getFinalExamByCourse = (courseId: string) =>
  api.get("/api/admin/quiz", { params: { courseId } });

export const submitQuiz = (data: { topicId: string; courseId: string; isFinalExam: boolean; timeTaken: number; answers: { questionId: string; selectedOptionId: string }[] }) =>
  api.post("/api/quiz/submit", data);
