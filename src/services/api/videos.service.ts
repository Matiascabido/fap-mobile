import { apiFetch } from './http';

export const videosService = {
  async getById(videoId: string): Promise<unknown> {
    return apiFetch<unknown>(
      `/videos/${encodeURIComponent(videoId)}`,
      { method: 'GET' },
      { suppressGlobalAlert: true }
    );
  },
};
