import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/lib/state/user-store';
import { Food } from '@/lib/types/nutrition';
import { SavedMeal } from '@/lib/state/nutrition-store';

import { BACKEND_URL } from '@/lib/config';
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function mapBackendMeal(m: any): SavedMeal {
  return {
    id: m.id,
    name: m.name,
    createdAt: new Date(m.createdAt).getTime(),
    entries: (m.items ?? []).map((item: any) => ({
      food: JSON.parse(item.foodData) as Food,
      servings: item.servings,
    })),
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

  // Recover from stale userId by re-registering with stored email
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

  const saveMealRequest = async (uid: string, id: string, name: string, entries: { food: Food; servings: number }[]) => {
    return fetch(`${BACKEND_URL}/api/saved-meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        userId: uid,
        name,
        items: entries.map(e => ({ foodData: JSON.stringify(e.food), servings: e.servings })),
      }),
    });
  };

  const createMeal = useMutation({
    mutationFn: async ({
      name,
      entries,
    }: {
      name: string;
      entries: { food: Food; servings: number }[];
    }) => {
      console.log('[SaveMeal] starting, userId:', userId);
      if (!userId) throw new Error('Not signed in');

      // Proactively verify userId is still valid before saving
      let activeUserId = userId;
      const checkRes = await fetch(`${BACKEND_URL}/api/signup/${userId}`);
      console.log('[SaveMeal] userId check status:', checkRes.status);
      if (checkRes.status === 404) {
        console.log('[SaveMeal] userId invalid, recovering...');
        const recovered = await recoverUser();
        if (!recovered) throw new Error('Failed to save meal');
        activeUserId = recovered;
        console.log('[SaveMeal] recovered to:', activeUserId);
      }

      const id = generateId();
      let res = await saveMealRequest(activeUserId, id, name, entries);
      console.log('[SaveMeal] response status:', res.status);

      if (res.status === 404) {
        const body = await res.json().catch(() => ({}));
        console.log('[SaveMeal] 404 body:', JSON.stringify(body));
        if (body.error === 'USER_NOT_FOUND') {
          console.log('[SaveMeal] unexpected USER_NOT_FOUND, recovering again...');
          const newId = await recoverUser();
          console.log('[SaveMeal] recovered newId:', newId);
          if (newId) {
            res = await saveMealRequest(newId, id, name, entries);
            console.log('[SaveMeal] retry status:', res.status);
          }
        }
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.log('[SaveMeal] FAILED:', res.status, JSON.stringify(errBody));
        throw new Error('Failed to save meal');
      }
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
      mealType: string;
    }) => {
      if (!userId) throw new Error('Not signed in');
      const res = await fetch(`${BACKEND_URL}/api/saved-meals/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, mealType }),
      });
      if (!res.ok) throw new Error('Failed to log meal');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] });
    },
  });

  return { savedMeals, isLoading, createMeal, updateMeal, deleteMeal, logMeal };
}
