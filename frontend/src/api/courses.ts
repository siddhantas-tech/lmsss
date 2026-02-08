import api from "./axios";

export const getCourses = () => api.get("/courses");

export const getCourseById = (id: string) =>
  api.get(`/courses/${id}`);

export const getCourseDetails = (id: string) =>
  api.get(`/courses/${id}/details`);

export const createCourse = (data: any) =>
  api.post("/courses", data);

export const deleteCourse = (id: string) =>
  api.delete(`/courses/${id}`);

