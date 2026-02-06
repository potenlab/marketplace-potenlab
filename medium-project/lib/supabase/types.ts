import type { User } from "@supabase/supabase-js";

// Re-export all database types
export * from "./database.types";

// Auth state types
export interface AuthState {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

// Profile type (for user profiles stored in auth.users metadata or profiles table)
export interface Profile {
	id: string;
	full_name: string | null;
	avatar_url: string | null;
	updated_at: string | null;
}
