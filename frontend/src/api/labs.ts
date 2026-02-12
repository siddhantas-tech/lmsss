import api from "./axios";

export const getLabs = () => api.get("/labs");


export const createLab = (data: { name: string; code: string; description: string }) =>
  api.post("/labs", data);

export const updateLab = (id: string, data: Partial<{ name: string; code: string; description: string }>) =>
  api.put(`/labs/${id}`, data);

export const deleteLab = (id: string) =>
  api.delete(`/labs/${id}`);

export const getLabsForCourse = (courseId: string) =>
  api.get(`/labs/courses/${courseId}/labs`);

export const assignLabToCourse = (courseId: string, labIds: string[]) =>
  api.post(`/labs/courses/${courseId}/labs`, { labIds });
