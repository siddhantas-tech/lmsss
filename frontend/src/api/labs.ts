import api from "./axios";

export const getLabs = () => api.get("/api/labs");


export const createLab = (data: { name: string; code: string; description: string }) =>
  api.post("/api/labs", data);

export const updateLab = (id: string, data: Partial<{ name: string; code: string; description: string }>) =>
  api.put(`/api/labs/${id}`, data);

export const deleteLab = (id: string) =>
  api.delete(`/api/labs/${id}`);

export const getLabsForCourse = (courseId: string) =>
  api.get(`/api/labs/courses/${courseId}/labs`);

export const assignLabToCourse = (courseId: string, labIds: string[]) =>
  api.post(`/api/labs/courses/${courseId}/labs`, { labIds });
