import api from "./axios";

export const getCourses = () => api.get("/api/courses");

export const getCourseById = (id: string) =>
  api.get(`/api/courses/${id}`);

export const getCourseDetails = (id: string) =>
  api.get(`/api/courses/${id}/details`);

export const createCourse = (data: any) =>
  api.post("/api/courses", data);

export const updateCourse = (id: string, data: any) =>
  api.put(`/api/courses/${id}`, data);

export const deleteCourse = (id: string) =>
  api.delete(`/api/courses/${id}`);

