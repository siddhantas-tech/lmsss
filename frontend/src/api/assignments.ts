import api from "./axios";

// Admin assignment endpoints
export const createAssignment = (data: { topic_id: string; title: string; description: string; max_marks: number; passing_marks: number }) =>
    api.post("/api/admin/assignments", data);

export const updateAssignment = (assignmentId: string, data: any) =>
    api.patch(`/api/admin/assignments/${assignmentId}`, data);

export const uploadAssignmentFile = (assignmentId: string, formData: FormData) =>
    api.post(`/api/admin/assignments/${assignmentId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getAssignmentByCourse = (courseId: string) =>
    api.get(`/api/assignments/course/${courseId}`);

export const submitAssignment = (assignmentId: string, formData: FormData) =>
    api.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getAssignmentSubmissions = (assignmentId: string) =>
    api.get(`/api/admin/assignments/${assignmentId}/submissions`);

export const evaluateSubmission = (submissionId: string, data: { marks_awarded: number }) =>
    api.post(`/api/admin/assignments/submissions/${submissionId}/evaluate`, data);

export const deleteAssignment = (assignmentId: string) =>
    api.delete(`/api/admin/assignments/${assignmentId}`);
