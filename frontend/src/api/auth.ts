import api from "./axios";

export const generateDevToken = (role: string) =>
  api.post("/dev/generate-token", { role });

export const generateAndStoreDevToken = async (role: 'admin' | 'client' = 'admin') => {
  try {
    const response = await generateDevToken(role);
    const token = response.data.token;
    localStorage.setItem('token', token);
    console.log(`Generated ${role} token and stored in localStorage`);
    return token;
  } catch (error) {
    console.error('Failed to generate dev token:', error);
    throw error;
  }
};

