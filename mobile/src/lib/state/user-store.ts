import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignupProfile {
  userName: string;
  userAge: string;
  userGender: string;
  userTrainingGoal: string;
  userGoals: string[];
}

interface UserStore extends SignupProfile {
  hasSignedUp: boolean;
  userId: string | null;
  userEmail: string | null;
  _hasHydrated: boolean;
  setSignedUp: (userId: string, email: string, profile: SignupProfile) => void;
  updateSignupProfile: (profile: Partial<SignupProfile> & { userEmail?: string }) => void;
  setHasHydrated: (value: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      hasSignedUp: false,
      userId: null,
      userEmail: null,
      userName: '',
      userAge: '',
      userGender: '',
      userTrainingGoal: '',
      userGoals: [],
      _hasHydrated: false,
      setSignedUp: (userId, email, profile) =>
        set({ hasSignedUp: true, userId, userEmail: email, ...profile }),
      updateSignupProfile: (data) => set((s) => ({ ...s, ...data })),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      clearUser: () =>
        set({
          hasSignedUp: false,
          userId: null,
          userEmail: null,
          userName: '',
          userAge: '',
          userGender: '',
          userTrainingGoal: '',
          userGoals: [],
        }),
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
