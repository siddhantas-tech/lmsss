import api from "./axios";

export const generateDevToken = (role: string) =>
  api.post("/dev/generate-token", { role });

