import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "@/components/layout";
import { createClient } from "@/lib/supabase/server";

interface ProtectedLayoutProps {
	children: ReactNode;
}

export default async function ProtectedLayout({
	children,
}: ProtectedLayoutProps) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen flex flex-col">
			<Header email={user.email ?? ""} />
			<main className="flex-1">{children}</main>
		</div>
	);
}
