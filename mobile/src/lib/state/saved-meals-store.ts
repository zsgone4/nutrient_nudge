import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/lib/state/user-store';
import { useNutritionStore } from '@/lib/state/nutrition-store';
import { SavedMeal } from '@/lib/state/nutrition-store';
import { Food, MealType } from '@/lib/types/nutrition';
import { BACKEND_URL } from '@/lib/config';

export type { SavedMeal };

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function mapBackendMeal(m: any): SavedMeal {
  return {
    id: m.id,
    name: m.name,
    createdAt: new Date(m.createdAt).getTime(),
    entries: (m.items ?? [])
      .map((item: any) => {
        try {
          const food = JSON.parse(item.foodData) as Food;
          if (!food?.macros) return null;
          return { food, servings: item.servings };
        } catch {
          return null;
        }
      })
      .filter((e: { food: Food; servings: number } | null): e is { food: Food; servings: number } => e !== null),
  };
}

export function useSavedMeals() {
  const userId = useUserStore(s => s.userId);
  const userEmail = useUserStore(s => s.userEmail);
  const userName = useUserStore(s => s.userName);
  const userAge = useUserStore(s => s.userAge);
  const userGender = useUserStore(s => s.userGender);
  const userTrainingGoal = useUserStore(s => s.userTrainingGoal);
  const userGoals = useUserStore(s => s.userGoals);
  const setSignedUp = useUserStore(s => s.setSignedUp);
  const addFoodEntry = useNutritionStore(s => s.addFoodEntry);
  const qc = useQueryClient();
  const queryKey = ['saved-meals', userId];

  const { data: savedMeals = [], isLoading } = useQuery<SavedMeal[]>({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`${BACKEND_URL}/api/saved-meals?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.savedMeals ?? []).map(mapBackendMeal);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  // Re-register with stored email when the userId becomes stale
  const recoverUser = async (): Promise<string | null> => {
    if (!userEmail) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName || 'User',
          age: parseInt(userAge, 10) || 25,
          gender: userGender || 'prefer-not-to-say',
          trainingGoal: userTrainingGoal || undefined,
          goals: userGoals.length > 0 ? userGoals : ['general'],
          agreedToPolicy: true,
        }),
      });
      const data = await res.json();
      if (data.user?.id) {
        setSignedUp(data.user.id, userEmail, {
          userName,
          userAge,
          userGender,
          userTrainingGoal,
          userGoals,
        });
        return data.user.id;
      }
      return null;
    } catch {
      return null;
    }
  };

  const saveMealRequest = async (
    uid: string,
    id: string,
    name: string,
    entries: { food: Food; servings: number }[]
  ) =>
    fetch(`${BACKEND_URL}/api/saved-meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        userId: uid,
        name,
        items: entries.map(e => ({ foodData: JSON.stringify(e.food), servings: e.servings })),
      }),
    });

  const createMeal = useMutation({
    mutationFn: async ({
      name,
      entries,
    }: {
      name: string;
      entries: { food: Food; servings: number }[];
    }) => {
      if (!userId) throw new Error('Not signed in');

      // Proactively verify userId is still valid
      let activeUserId = userId;
      const checkRes = await fetch(`${BACKEND_URL}/api/signup/${userId}`);
      if (checkRes.status === 404) {
        const recovered = await recoverUser();
        if (!recovered) throw new Error('Failed to save meal');
        activeUserId = recovered;
      }

      const id = generateId();
      let res = await saveMealRequest(activeUserId, id, name, entries);

      if (res.status === 404) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'USER_NOT_FOUND') {
          const newId = await recoverUser();
          if (newId) res = await saveMealRequest(newId, id, name, entries);
        }
      }

      if (!res.ok) throw new Error('Failed to save meal');
      return res.json();
    },
    onSuccess: invalidate,
  });

  const updateMeal = useMutation({
    mutationFn: async ({
      id,
      name,
      entries,
    }: {
      id: string;
      name: string;
      entries: { food: Food; servings: number }[];
    }) => {
      if (!userId) throw new Error('Not signed in');
      let res = await saveMealRequest(userId, id, name, entries);

      if (res.status === 404) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'USER_NOT_FOUND') {
          const newId = await recoverUser();
          if (newId) res = await saveMealRequest(newId, id, name, entries);
        }
      }

      if (!res.ok) throw new Error('Failed to update meal');
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BACKEND_URL}/api/saved-meals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete meal');
    },
    onSuccess: invalidate,
  });

  const logMeal = useMutation({
    mutationFn: async ({
      id,
      date,
      mealType,
    }: {
      id: string;
      date: string;
      mealType: MealType;
    }) => {
      if (!userId) throw new Error('Not signed in');
      const res = await fetch(`${BACKEND_URL}/api/saved-meals/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, mealType }),
      });
      if (!res.ok) throw new Error('Failed to log meal');
      return { ...(await res.json()), mealId: id, mealType };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['food-logs'] });
      // Mirror backend log entries into the local Zustand diary so the
      // diary screen reflects the new items without needing a manual refresh.
      const meal = (qc.getQueryData<SavedMeal[]>(queryKey) ?? []).find(
        m => m.id === data.mealId
      );
      if (meal) {
        meal.entries.forEach(e => addFoodEntry(e.food, e.servings, data.mealType));
      }
    },
  });

  return { savedMeals, isLoading, createMeal, updateMeal, deleteMeal, logMeal };
}
