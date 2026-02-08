import api from "./axios";

export const enrollCourse = (courseId: string) =>
  api.post("/enrollments", { courseId });

export const getMyEnrollments = () =>
  api.get("/enrollments/me");
