import api from './axios'

export interface Video {
  id: string
  title: string
  url: string
  created_at?: string
  updated_at?: string
}

export const createVideo = (data: { title: string; url: string; courseId: string; topicId: string }) =>
  api.post("/video", data);

// Stream Video URL generator (not calling API, just producing the URL)
export const getStreamUrl = (topicId: string) =>
  `${api.defaults.baseURL}/video?topicId=${topicId}`;

export const getSignedUrl = (topicId: string) =>
  api.get("/video/signed-url", { params: { topicId } });

export const updateVideo = (topicId: string, payload: { title?: string; url?: string }) =>
  api.put(`/video/${topicId}`, payload);
