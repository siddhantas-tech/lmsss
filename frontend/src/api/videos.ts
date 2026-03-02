import api from './axios'

export interface Video {
  id: string
  title: string
  url: string
  video_path?: string
  topic_id: string
  order_index?: number
  created_at?: string
  updated_at?: string
}

// Create Video via URL record (Admin)
export const createVideo = (data: { title: string; url: string; course_id: string; topic_id: string }) =>
  api.post("/api/videos", data);

// Upload Single Video File (Admin)
export const uploadVideo = (formData: FormData) =>
  api.post("/api/videos/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Upload Multiple Video Files (Admin)
export const uploadMultipleVideos = (formData: FormData) =>
  api.post("/api/videos/upload-multiple", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Get Videos by Topic
export const getVideosByTopic = (topicId: string) =>
  api.get(`/api/videos/topic/${topicId}`);

// Stream Video URL generator (Public)
export const getStreamUrl = (topicId: string) =>
  `${api.defaults.baseURL}/api/videos?topicId=${topicId}`;

// Get Signed URL (Client)
export const getSignedUrl = (topicId: string) =>
  api.get("/api/videos/signed-url", { params: { topicId } });

// Update Video (Admin)
export const updateVideo = (videoId: string, payload: { title?: string; url?: string; description?: string; order_index?: number }) =>
  api.put(`/api/videos/${videoId}`, payload);

// Delete Video (Admin)
export const deleteVideo = (id: string) =>
  api.delete(`/api/videos/${id}`);

// Reorder Videos (Admin)
export const reorderVideos = (topicId: string, videoIds: string[]) =>
  api.post(`/api/videos/topic/${topicId}/reorder`, { videoIds });
