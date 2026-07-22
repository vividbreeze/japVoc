import axios from 'axios';
import type { Collection, ReviewQueue, ReviewResult, Settings, Stats, Word } from '../types';

const TOKEN_KEY = 'japvoc_auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({ baseURL: '/api' });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and reload so App re-checks auth
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && getToken()) {
      setToken(null);
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// Auth
export const checkAuth = () =>
  api.get<{ ok: boolean; authRequired: boolean }>('/auth/check').then((r) => r.data);

export const login = (password: string) =>
  api.post<{ ok: boolean; token: string | null }>('/auth/login', { password }).then((r) => r.data);

// Words
export const fetchWords = (params?: Record<string, string>) =>
  api.get<{ words: Word[]; total: number; page: number; limit: number }>('/words', { params }).then((r) => r.data);

export const fetchWord = (id: string) => api.get<Word>(`/words/${id}`).then((r) => r.data);

export const fetchWortarten = () => api.get<string[]>('/words/wortarten').then((r) => r.data);

export interface WordInput {
  hiragana: string;
  kanji?: string;
  romaji?: string;
  deutsch: string;
  wortart: string;
  beispielsatz_jp?: string;
  beispielsatz_de?: string;
  collectionId?: string;
}

export const createWord = (data: WordInput) =>
  api.post<Word>('/words', data).then((r) => r.data);

export const updateWord = (id: string, data: Omit<WordInput, 'collectionId'>) =>
  api.put<Word>(`/words/${id}`, data).then((r) => r.data);

export const deleteWord = (id: string) =>
  api.delete(`/words/${id}`).then((r) => r.data);

// Collections
export const fetchCollections = () => api.get<Collection[]>('/collections').then((r) => r.data);

export const createCollection = (name: string, beschreibung?: string) =>
  api.post<Collection>('/collections', { name, beschreibung }).then((r) => r.data);

export const updateCollection = (id: string, name: string, beschreibung?: string) =>
  api.put<Collection>(`/collections/${id}`, { name, beschreibung }).then((r) => r.data);

export const deleteCollection = (id: string) => api.delete(`/collections/${id}`);

export const fetchCollectionWords = (id: string, params?: Record<string, string>) =>
  api.get<Word[]>(`/collections/${id}/words`, { params }).then((r) => r.data);

export const addWordToCollection = (collectionId: string, wordId: string) =>
  api.post(`/collections/${collectionId}/words`, { wordId }).then((r) => r.data);

export const removeWordFromCollection = (collectionId: string, wordId: string) =>
  api.delete(`/collections/${collectionId}/words/${wordId}`);

// Review
export const fetchReviewQueue = (collectionId?: string) =>
  api.get<ReviewQueue>('/review/queue', { params: collectionId ? { collectionId } : {} }).then((r) => r.data);

export const submitReview = (wordId: string, rating: number) =>
  api.post<ReviewResult>('/review', { wordId, rating }).then((r) => r.data);

// Stats
export const fetchStats = () => api.get<Stats>('/stats').then((r) => r.data);

// Settings
export const fetchSettings = () => api.get<Settings>('/settings').then((r) => r.data);

export const updateSettings = (settings: Partial<Settings>) =>
  api.put<Settings>('/settings', settings).then((r) => r.data);

// Backup
export const exportBackup = () =>
  api.get('/backup/export', { responseType: 'blob' }).then((r) => r.data as Blob);

export const importBackup = (data: unknown) =>
  api.post<{ success: boolean; wordsCreated: number; collectionsCreated: number; progressRestored: number }>(
    '/backup/import', data
  ).then((r) => r.data);

export const importReplaceBackup = (data: unknown) =>
  api.post<{ success: boolean; wordsCreated: number; collectionsCreated: number; progressRestored: number }>(
    '/backup/import?replace=true', data
  ).then((r) => r.data);
