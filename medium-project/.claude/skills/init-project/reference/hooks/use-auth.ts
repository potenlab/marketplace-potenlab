"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
	const { user, isLoading, isInitialized, setUser, setInitialized, reset } =
		useAuthStore();

	useEffect(() => {
		const supabase = createClient();

		// Get initial session
		const initializeAuth = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setUser(user);
			setInitialized(true);
		};

		initializeAuth();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [setUser, setInitialized]);

	const signOut = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		reset();
	};

	return {
		user,
		isLoading,
		isInitialized,
		isAuthenticated: user !== null,
		signOut,
	};
}
