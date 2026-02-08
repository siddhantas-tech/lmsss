import api from "./axios";

export const getLabs = () => api.get("/labs");

export const getLabById = (id: string) =>
  api.get(`/labs/${id}`);

export const getLabsForCourse = (courseId: string) =>
  api.get(`/labs/courses/${courseId}/labs`);

export const createLab = (data: any) =>
  api.post("/labs", data);

export const assignLabToCourse = (courseId: string, data: any) =>
  api.post(`/labs/courses/${courseId}/labs`, data);
