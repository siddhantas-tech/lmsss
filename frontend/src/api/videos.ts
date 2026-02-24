import api from './axios'

export interface Video {
  id: string
  title: string
  url: string
  created_at?: string
  updated_at?: string
}

// Create Video via URL record (Admin)
export const createVideo = (data: { title: string; url: string; course_id: string; topic_id: string }) =>
  api.post("/api/video", data);

// Upload Video File (Admin)
export const uploadVideo = (formData: FormData) =>
  api.post("/api/video/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Stream Video URL generator (Public)
export const getStreamUrl = (topicId: string) =>
  `${api.defaults.baseURL}/api/video?topicId=${topicId}`;

// Get Signed URL (Client)
export const getSignedUrl = (topicId: string) =>
  api.get("/api/video/signed-url", { params: { topicId } });

// Update Video (Admin)
export const updateVideo = (topicId: string, payload: { title?: string; url?: string; description?: string }) =>
  api.put(`/api/video/${topicId}`, payload);

// Delete Video (Admin)
export const deleteVideo = (id: string) =>
  api.delete(`/api/video/${id}`);
