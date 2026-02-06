import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function ProfilePage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Fetch profile from database
	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.single();

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
			{/* Header */}
			<div>
				<h1 className="font-mono text-2xl md:text-3xl font-bold uppercase">
					Profile
				</h1>
				<p className="font-mono text-sm text-muted-foreground">
					Manage your account settings
				</p>
			</div>

			{/* Personal Information */}
			<div className="brutal-border bg-background p-6">
				<div className="mb-6">
					<h2 className="font-mono text-lg font-bold uppercase">
						Personal Information
					</h2>
					<p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
						Update your profile information and avatar
					</p>
				</div>
				<ProfileForm user={user} profile={profile as Profile | null} />
			</div>

			{/* Security */}
			<div className="brutal-border bg-background p-6" id="security">
				<div className="mb-6">
					<h2 className="font-mono text-lg font-bold uppercase">Security</h2>
					<p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
						Manage your account security
					</p>
				</div>
				<dl className="space-y-4">
					<div className="flex justify-between items-center brutal-border p-4 bg-muted/30">
						<div>
							<dt className="font-mono text-sm font-bold uppercase">
								Password
							</dt>
							<dd className="font-mono text-xs text-muted-foreground">
								Last changed: Unknown
							</dd>
						</div>
						<a
							href="/auth/reset-password"
							className="font-mono text-sm font-bold uppercase brutal-border px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
						>
							Change
						</a>
					</div>
					<div className="flex justify-between items-center brutal-border p-4 bg-muted/30">
						<div>
							<dt className="font-mono text-sm font-bold uppercase">
								Two-Factor Auth
							</dt>
							<dd className="font-mono text-xs text-muted-foreground">
								Not enabled
							</dd>
						</div>
						<span className="font-mono text-xs text-muted-foreground uppercase">
							Coming soon
						</span>
					</div>
				</dl>
			</div>

			{/* Account Info */}
			<div className="brutal-border bg-background p-6">
				<div className="mb-6">
					<h2 className="font-mono text-lg font-bold uppercase">
						Account Info
					</h2>
					<p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
						Your account details
					</p>
				</div>
				<dl className="space-y-3">
					<div className="flex justify-between items-center py-2 border-b border-border">
						<dt className="font-mono text-xs text-muted-foreground uppercase">
							User ID
						</dt>
						<dd className="font-mono text-xs">{user.id}</dd>
					</div>
					<div className="flex justify-between items-center py-2 border-b border-border">
						<dt className="font-mono text-xs text-muted-foreground uppercase">
							Created
						</dt>
						<dd className="font-mono text-sm">
							{user.created_at
								? new Date(user.created_at).toLocaleDateString()
								: "N/A"}
						</dd>
					</div>
					<div className="flex justify-between items-center py-2">
						<dt className="font-mono text-xs text-muted-foreground uppercase">
							Auth Provider
						</dt>
						<dd className="font-mono text-sm uppercase">
							{user.app_metadata?.provider || "email"}
						</dd>
					</div>
				</dl>
			</div>
		</div>
	);
}
