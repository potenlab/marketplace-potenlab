"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { DesktopNav, MobileNav } from "./mobile-nav";

interface HeaderProps {
	email: string;
}

export function Header({ email }: HeaderProps) {
	return (
		<header className="border-b-2 border-foreground bg-background sticky top-0 z-40">
			<div className="container flex h-14 md:h-16 items-center justify-between px-4">
				<MobileNav />
				<DesktopNav />
				<div className="flex items-center gap-2 md:gap-4">
					<span className="hidden sm:block font-mono text-sm text-muted-foreground truncate max-w-[150px] md:max-w-none">
						{email}
					</span>
					<SignOutButton />
				</div>
			</div>
		</header>
	);
}
