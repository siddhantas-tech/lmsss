import api from "./axios";

export const getLessonsByCourse = (courseId: string) =>
  api.get(`/lessons/course/${courseId}`);

export const markLessonComplete = (lessonId: string) =>
  api.post(`/lessons/${lessonId}/complete`);

export const createLesson = (data: any) => {
  return api.post("/lessons", data);
};
