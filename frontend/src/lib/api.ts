import axios from 'axios';
import { Post, ModerationResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const response = await api.post('/moderate', { text });
    return response.data;
  } catch (error) {
    console.error('Moderation API error:', error);
    throw new Error('Failed to moderate content');
  }
}

export async function createPost(text: string): Promise<Post> {
  try {
    const response = await api.post('/posts', { text });
    return response.data;
  } catch (error) {
    console.error('Create post error:', error);
    throw new Error('Failed to create post');
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    const response = await api.get('/posts');
    return response.data;
  } catch (error) {
    console.error('Get posts error:', error);
    throw new Error('Failed to fetch posts');
  }
}
