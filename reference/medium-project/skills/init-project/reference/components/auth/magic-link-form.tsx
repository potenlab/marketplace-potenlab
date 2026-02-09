"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { type MagicLinkInput, magicLinkSchema } from "@/lib/validations/auth";

interface MagicLinkFormProps {
	redirectTo?: string;
}

export function MagicLinkForm({
	redirectTo = "/dashboard",
}: MagicLinkFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [emailSent, setEmailSent] = useState(false);

	const form = useForm<MagicLinkInput>({
		resolver: zodResolver(magicLinkSchema),
		defaultValues: {
			email: "",
		},
	});

	async function onSubmit(data: MagicLinkInput) {
		setIsLoading(true);
		const supabase = createClient();

		const { error } = await supabase.auth.signInWithOtp({
			email: data.email,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
			},
		});

		if (error) {
			toast.error(error.message);
			setIsLoading(false);
			return;
		}

		setEmailSent(true);
		toast.success("Check your email for the magic link!");
		setIsLoading(false);
	}

	if (emailSent) {
		return (
			<div className="text-center space-y-4">
				<div className="text-4xl">📧</div>
				<h3 className="font-semibold text-lg">Check your email</h3>
				<p className="text-muted-foreground">
					We sent a magic link to <strong>{form.getValues("email")}</strong>
				</p>
				<Button
					variant="ghost"
					onClick={() => setEmailSent(false)}
					className="mt-4"
				>
					Use a different email
				</Button>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="you@example.com"
									autoComplete="email"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? "Sending link..." : "Send magic link"}
				</Button>
			</form>
		</Form>
	);
}
