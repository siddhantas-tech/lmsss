import api from "./axios";

export const createAssignment = (data: { course_id: string; title: string; description: string; max_marks: number; passing_marks: number }) =>
    api.post("/admin/assignments", data);

export const updateAssignment = (assignmentId: string, data: any) =>
    api.patch(`/admin/assignments/${assignmentId}`, data);

export const uploadAssignmentFile = (assignmentId: string, formData: FormData) =>
    api.post(`/admin/assignments/${assignmentId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getAssignmentByCourse = (courseId: string) =>
    api.get(`/assignments/course/${courseId}`);

export const submitAssignment = (assignmentId: string, formData: FormData) =>
    api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getAssignmentSubmissions = (assignmentId: string) =>
    api.get(`/admin/assignments/${assignmentId}/submissions`);

export const evaluateSubmission = (submissionId: string, data: { marks_awarded: number }) =>
    api.post(`/admin/assignments/submissions/${submissionId}/evaluate`, data);

export const deleteAssignment = (assignmentId: string) =>
    api.delete(`/admin/assignments/${assignmentId}`);
