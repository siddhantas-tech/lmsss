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
  api.post("/api/videos", data);

// Upload Video File (Admin)
export const uploadVideo = (formData: FormData) =>
  api.post("/api/videos/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Stream Video URL generator (Public)
export const getStreamUrl = (topicId: string) =>
  `${api.defaults.baseURL}/api/videos?topicId=${topicId}`;

// Get Signed URL (Client)
export const getSignedUrl = (topicId: string) =>
  api.get("/api/videos/signed-url", { params: { topicId } });

// Update Video (Admin)
export const updateVideo = (topicId: string, payload: { title?: string; url?: string; description?: string }) =>
  api.put(`/api/videos/${topicId}`, payload);

// Delete Video (Admin)
export const deleteVideo = (id: string) =>
  api.delete(`/api/videos/${id}`);
