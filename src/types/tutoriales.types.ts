// Tipos del módulo Tutoriales (adaptados del frontend web)

export interface Tutorial {
  id: string;
  catalogVideoId?: string | null;
  titulo: string;
  descripcion: string;
  videoUrl: string;
  embedUrl: string;
  thumbnail: string;
  instructor: string;
  publishedAt: string;
  grupos: string[];
}

export interface TutorialesResponse {
  total: number;
  skip: number;
  limit: number;
  items: Tutorial[];
}
