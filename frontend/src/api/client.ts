import axios from 'axios';
import type { Collection, ReviewQueue, ReviewResult, Settings, Stats, Word } from '../types';

const api = axios.create({ baseURL: '/api' });

// Words
export const fetchWords = (params?: Record<string, string>) =>
  api.get<{ words: Word[]; total: number; page: number; limit: number }>('/words', { params }).then((r) => r.data);

export const fetchWord = (id: string) => api.get<Word>(`/words/${id}`).then((r) => r.data);

export const fetchWortarten = () => api.get<string[]>('/words/wortarten').then((r) => r.data);

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
