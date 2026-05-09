import axios from 'axios';

const API_BASE_URL = 'https://nutrient-nudge-1.onrender.com/api';

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
    const response = await axios.get<{ totalUsers: number; users: DashboardUser[] }>(
      `${API_BASE_URL}/dashboard/users`
    );
    return response.data;
  },

  async getUserDetails(userId: string) {
    const response = await axios.get(`${API_BASE_URL}/dashboard/users/${userId}`);
    return response.data;
  },

  async getStats() {
    const response = await axios.get<{ stats: DashboardStats }>(
      `${API_BASE_URL}/dashboard/stats`
    );
    return response.data.stats;
  },

  async getNutrientScoreHistory(userId: string, limit = 30) {
    const response = await axios.get(`${API_BASE_URL}/nutrient-score/history/${userId}`, {
      params: { limit }
    });
    return response.data;
  }
};
