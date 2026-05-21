import axios from 'axios';
import { log } from './lib/logger';

const API_BASE_URL = 'https://nutrient-nudge-1.onrender.com/api';

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  log.debug('api.request', { method: config.method, url: config.url });
  return config;
});

client.interceptors.response.use(
  (response) => {
    log.debug('api.response', { status: response.status, url: response.config.url });
    return response;
  },
  (error) => {
    log.error('api.response.error', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export interface DashboardUser {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  goals: string[];
  trainingGoal?: string;
  profile: {
    height: number;
    weight: number;
    sex: string;
    activityLevel: string;
    goal: string;
    isSetup: boolean;
  } | null;
  foodEntries: {
    total: number;
    dates: string[];
  };
  latestNutrientScore: {
    date: string;
    score: number;
    micronutrients: Record<string, number>;
  } | null;
  joinedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  usersWithCompleteProfile: number;
  totalFoodEntries: number;
  totalFoodsInDatabase: number;
  totalNutrientScores: number;
  averageNutrientScore: number;
  usersByGoal: Record<string, number>;
}

export const dashboardAPI = {
  async getUsers() {
    const response = await client.get<{ totalUsers: number; users: DashboardUser[] }>('/dashboard/users');
    return response.data;
  },

  async getUserDetails(userId: string) {
    const response = await client.get(`/dashboard/users/${userId}`);
    return response.data;
  },

  async getStats() {
    const response = await client.get<{ stats: DashboardStats }>('/dashboard/stats');
    return response.data.stats;
  },

  async getNutrientScoreHistory(userId: string, limit = 30) {
    const response = await client.get(`/nutrient-score/history/${userId}`, { params: { limit } });
    return response.data;
  }
};
