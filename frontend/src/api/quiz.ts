import api from "./axios";

export const getQuestions = (params: { topic_id?: string; course_id?: string; is_final_exam?: boolean }) =>
  api.get("/quiz", { params });

export const createQuestion = (data: any) =>
  api.post("/quiz", data);

export const updateQuestion = (id: string, data: any) =>
  api.put(`/quiz/${id}`, data);

export const deleteQuestion = (id: string) =>
  api.delete(`/quiz/${id}`);

// User side
export const getQuizByTopic = (topic_id: string) =>
  api.get(`/quiz/topic/${topic_id}`);

export const getFinalExamByCourse = (course_id: string) =>
  api.get("/quiz", { params: { course_id, is_final_exam: true } });

export const submitQuiz = (data: { topic_id?: string; course_id?: string; answers: any[] }) =>
  api.post("/quiz/submit", data);
