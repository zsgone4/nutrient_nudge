import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Food,
  FoodLogEntry,
  MealType,
  Macronutrients,
  Micronutrients,
  DAILY_VALUES,
} from '../types/nutrition';

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0];

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create empty nutrition objects
const emptyMacros: Macronutrients = {
  calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0,
};

const emptyMicros: Micronutrients = {
  vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
  vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
  vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
  phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
  selenium: 0, chromium: 0, iodine: 0,
};

interface NutritionState {
  // Daily log entries keyed by date (YYYY-MM-DD)
  logs: Record<string, FoodLogEntry[]>;

  // User's daily goals (can be customized)
  dailyGoals: {
    macros: Macronutrients;
    micros: Micronutrients;
  };

  // Current date being viewed
  selectedDate: string;

  // Actions
  addFoodEntry: (food: Food, servings: number, mealType: MealType) => void;
  removeFoodEntry: (entryId: string) => void;
  updateFoodEntry: (entryId: string, servings: number) => void;
  setSelectedDate: (date: string) => void;
  setDailyGoals: (goals: { macros: Macronutrients; micros: Micronutrients }) => void;

  // Computed getters
  getEntriesForDate: (date: string) => FoodLogEntry[];
  getEntriesForMeal: (date: string, mealType: MealType) => FoodLogEntry[];
  getTotalsForDate: (date: string) => { macros: Macronutrients; micros: Micronutrients };
  getRemainingForDate: (date: string) => { macros: Macronutrients; micros: Micronutrients };
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      logs: {},
      dailyGoals: DAILY_VALUES,
      selectedDate: getTodayString(),

      addFoodEntry: (food, servings, mealType) => {
        const date = get().selectedDate;
        const entry: FoodLogEntry = {
          id: generateId(),
          food,
          servings,
          mealType,
          timestamp: Date.now(),
          date,
        };

        set(state => ({
          logs: {
            ...state.logs,
            [date]: [...(state.logs[date] || []), entry],
          },
        }));
      },

      removeFoodEntry: (entryId) => {
        const date = get().selectedDate;
        set(state => ({
          logs: {
            ...state.logs,
            [date]: (state.logs[date] || []).filter(e => e.id !== entryId),
          },
        }));
      },

      updateFoodEntry: (entryId, servings) => {
        const date = get().selectedDate;
        set(state => ({
          logs: {
            ...state.logs,
            [date]: (state.logs[date] || []).map(e =>
              e.id === entryId ? { ...e, servings } : e
            ),
          },
        }));
      },

      setSelectedDate: (date) => set({ selectedDate: date }),

      setDailyGoals: (goals) => set({ dailyGoals: goals }),

      getEntriesForDate: (date) => get().logs[date] || [],

      getEntriesForMeal: (date, mealType) =>
        (get().logs[date] || []).filter(e => e.mealType === mealType),

      getTotalsForDate: (date) => {
        const entries = get().logs[date] || [];

        const totals = {
          macros: { ...emptyMacros },
          micros: { ...emptyMicros },
        };

        entries.forEach(entry => {
          const multiplier = entry.servings;
          const { macros, micros } = entry.food;

          // Sum macros
          (Object.keys(totals.macros) as (keyof Macronutrients)[]).forEach(key => {
            totals.macros[key] += macros[key] * multiplier;
          });

          // Sum micros
          (Object.keys(totals.micros) as (keyof Micronutrients)[]).forEach(key => {
            totals.micros[key] += micros[key] * multiplier;
          });
        });

        return totals;
      },

      getRemainingForDate: (date) => {
        const totals = get().getTotalsForDate(date);
        const goals = get().dailyGoals;

        const remaining = {
          macros: { ...emptyMacros },
          micros: { ...emptyMicros },
        };

        (Object.keys(remaining.macros) as (keyof Macronutrients)[]).forEach(key => {
          remaining.macros[key] = Math.max(0, goals.macros[key] - totals.macros[key]);
        });

        (Object.keys(remaining.micros) as (keyof Micronutrients)[]).forEach(key => {
          remaining.micros[key] = Math.max(0, goals.micros[key] - totals.micros[key]);
        });

        return remaining;
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        logs: state.logs,
        dailyGoals: state.dailyGoals,
      }),
    }
  )
);
