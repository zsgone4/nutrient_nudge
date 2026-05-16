import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/lib/state/user-store';
import { Food } from '@/lib/types/nutrition';
import { SavedMeal } from '@/lib/state/nutrition-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
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

  const createMeal = useMutation({
    mutationFn: async ({
      name,
      entries,
    }: {
      name: string;
      entries: { food: Food; servings: number }[];
    }) => {
      if (!userId) throw new Error('Not signed in');
      const id = generateId();
      const res = await fetch(`${BACKEND_URL}/api/saved-meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          userId,
          name,
          items: entries.map(e => ({ foodData: JSON.stringify(e.food), servings: e.servings })),
        }),
      });
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
      const res = await fetch(`${BACKEND_URL}/api/saved-meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          userId,
          name,
          items: entries.map(e => ({ foodData: JSON.stringify(e.food), servings: e.servings })),
        }),
      });
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

  return { savedMeals, isLoading, createMeal, updateMeal, deleteMeal };
}
