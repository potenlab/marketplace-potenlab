"use client";

import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import type { Profile } from "@/lib/supabase/types";

interface AuthState {
	user: User | null;
	profile: Profile | null;
	isLoading: boolean;
	isInitialized: boolean;
}

interface AuthActions {
	setUser: (user: User | null) => void;
	setProfile: (profile: Profile | null) => void;
	setLoading: (isLoading: boolean) => void;
	setInitialized: (isInitialized: boolean) => void;
	reset: () => void;
}

const initialState: AuthState = {
	user: null,
	profile: null,
	isLoading: true,
	isInitialized: false,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
	...initialState,

	setUser: (user) => set({ user, isLoading: false }),

	setProfile: (profile) => set({ profile }),

	setLoading: (isLoading) => set({ isLoading }),

	setInitialized: (isInitialized) => set({ isInitialized, isLoading: false }),

	reset: () => set(initialState),
}));

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () =>
	useAuthStore((state) => state.user !== null);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
