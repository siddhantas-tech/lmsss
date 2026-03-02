import api from "./axios";
import type { Video } from "./videos";

export interface Topic {
  id: string
  title: string
  description?: string
  course_id: string
  order_index: number
  videos?: Video[]
  created_at?: string
  updated_at?: string
}

export const getTopicsByCourse = (courseId: string) =>
  api.get(`/api/topics/course/${courseId}`);

export const getTopicsWithVideos = (courseId: string) =>
  api.get(`/api/topics/course/${courseId}/with-videos`);

export const createTopic = (data: { title: string; description?: string; course_id: string; order_index: number }) =>
  api.post('/api/topics', data);

export const updateTopic = (id: string, data: { title?: string; description?: string; order_index?: number }) =>
  api.put(`/api/topics/${id}`, data);

export const deleteTopic = (id: string) =>
  api.delete(`/api/topics/${id}`);

export const completeTopic = (topicId: string, data: { course_id: string; watch_duration_seconds?: number }) =>
  api.post(`/api/topics/${topicId}/complete`, data);
