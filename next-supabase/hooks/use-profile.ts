"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export function useProfile(userId: string | undefined) {
	const supabase = createClient();

	return useQuery({
		queryKey: ["profile", userId],
		queryFn: async () => {
			if (!userId) return null;

			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (error) {
				// Profile doesn't exist yet, return null
				if (error.code === "PGRST116") {
					return null;
				}
				throw error;
			}

			return data as Profile;
		},
		enabled: !!userId,
	});
}

interface UpdateProfileParams {
	userId: string;
	fullName?: string;
	avatarUrl?: string;
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();
	const supabase = createClient();

	return useMutation({
		mutationFn: async ({
			userId,
			fullName,
			avatarUrl,
		}: UpdateProfileParams) => {
			const updates: Partial<Profile> = {
				id: userId,
				updated_at: new Date().toISOString(),
			};

			if (fullName !== undefined) {
				updates.full_name = fullName;
			}

			if (avatarUrl !== undefined) {
				updates.avatar_url = avatarUrl;
			}

			const { data, error } = await supabase
				.from("profiles")
				.upsert(updates)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["profile", data.id], data);
			toast.success("Profile updated successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUploadAvatar() {
	const supabase = createClient();

	return useMutation({
		mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
			const fileExt = file.name.split(".").pop();
			const filePath = `${userId}/avatar.${fileExt}`;

			// Upload the file
			const { error: uploadError } = await supabase.storage
				.from("avatars")
				.upload(filePath, file, { upsert: true });

			if (uploadError) throw uploadError;

			// Get the public URL
			const {
				data: { publicUrl },
			} = supabase.storage.from("avatars").getPublicUrl(filePath);

			return publicUrl;
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}
