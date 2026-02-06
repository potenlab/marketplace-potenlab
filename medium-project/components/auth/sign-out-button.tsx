"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface SignOutButtonProps {
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	className?: string;
}

export function SignOutButton({
	variant = "ghost",
	className,
}: SignOutButtonProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleSignOut = async () => {
		setIsLoading(true);
		const supabase = createClient();

		const { error } = await supabase.auth.signOut();

		if (error) {
			toast.error(error.message);
			setIsLoading(false);
			return;
		}

		toast.success("Signed out successfully");
		router.push("/login");
		router.refresh();
	};

	return (
		<Button
			variant={variant}
			onClick={handleSignOut}
			disabled={isLoading}
			className={className}
		>
			{isLoading ? "Signing out..." : "Sign out"}
		</Button>
	);
}
