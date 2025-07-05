import { LOCAL_CONFIG } from './local';

// API Configuration
export const API_CONFIG = {
  HUGGING_FACE_API_KEY: LOCAL_CONFIG.HUGGING_FACE_API_KEY,
  HUGGING_FACE_BASE_URL: 'https://api-inference.huggingface.co/models',
};

// API endpoints
export const API_ENDPOINTS = {
  BART_LARGE_CNN: `${API_CONFIG.HUGGING_FACE_BASE_URL}/facebook/bart-large-cnn`,
  DISTILBART_CNN: `${API_CONFIG.HUGGING_FACE_BASE_URL}/sshleifer/distilbart-cnn-12-6`,
};