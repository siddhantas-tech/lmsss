import api from "./axios";

// Admin quiz endpoints
export const getQuestions = (params: { course_id?: string; topic_id?: string; is_final_exam?: boolean }) =>
  api.get("/admin/quiz", { params });

export const createQuestion = (data: any) =>
  api.post("/admin/quiz", data);

export const updateQuestion = (id: string, data: any) =>
  api.put(`/admin/quiz/${id}`, data);

export const deleteQuestion = (id: string) =>
  api.delete(`/admin/quiz/${id}`);

// User side
export const getQuizByTopic = (topic_id: string) =>
  api.get(`/quiz/topic/${topic_id}`);

export const getFinalExamByCourse = (course_id: string) =>
  api.get("/admin/quiz", { params: { course_id, is_final_exam: true } });

export const submitQuiz = (data: { topicId?: string; courseId?: string; isFinalExam?: boolean; timeTaken?: number; answers: any[] }) =>
  api.post("/quiz/submit", data);
