import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStore {
  hasSignedUp: boolean;
  userId: string | null;
  userEmail: string | null;
  _hasHydrated: boolean;
  setSignedUp: (userId: string, email: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      hasSignedUp: false,
      userId: null,
      userEmail: null,
      _hasHydrated: false,
      setSignedUp: (userId, email) => set({ hasSignedUp: true, userId, userEmail: email }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
