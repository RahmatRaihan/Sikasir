// Zustand Auth Store — State management untuk autentikasi sederhana
import { create } from 'zustand';

export type UserRole = 'kasir' | 'admin';

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  role: UserRole;

  // Actions
  login: (username: string, role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  username: '',
  role: 'kasir',

  login: (username, role) =>
    set({
      isLoggedIn: true,
      username,
      role,
    }),

  logout: () =>
    set({
      isLoggedIn: false,
      username: '',
      role: 'kasir',
    }),
}));
