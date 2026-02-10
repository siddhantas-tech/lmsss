import api from './axios'

export interface Video {
  id: string
  title: string
  url: string
  created_at?: string
  updated_at?: string
}

export async function updateVideo(id: string, payload: { title?: string; url?: string }) {
  const { data } = await api.put<Video>(`/video/${id}`, payload)
  return data
}
