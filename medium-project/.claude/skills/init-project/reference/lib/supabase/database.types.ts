export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			// Add your tables here after running:
			// bunx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

// Helper types - uncomment after generating types
// export type Tables<T extends keyof Database["public"]["Tables"]> =
//   Database["public"]["Tables"][T]["Row"]

// export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
//   Database["public"]["Tables"][T]["Insert"]

// export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
//   Database["public"]["Tables"][T]["Update"]
