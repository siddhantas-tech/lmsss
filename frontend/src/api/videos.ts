import api from './axios'

export interface Video {
  id: string
  title: string
  url: string
  created_at?: string
  updated_at?: string
}

// Create Video via URL record (Admin)
export const createVideo = (data: { title: string; url: string; courseId: string; topicId: string }) =>
  api.post("/video", data);

// Upload Video File (Admin)
export const uploadVideo = (formData: FormData) =>
  api.post("/video/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Stream Video URL generator (Public)
export const getStreamUrl = (topicId: string) =>
  `${api.defaults.baseURL}/video?topicId=${topicId}`;

// Get Signed URL (Client)
export const getSignedUrl = (topicId: string) =>
  api.get("/video/signed-url", { params: { topicId } });

// Update Video (Admin)
export const updateVideo = (topicId: string, payload: { title?: string; url?: string }) =>
  api.put(`/video/${topicId}`, payload);
