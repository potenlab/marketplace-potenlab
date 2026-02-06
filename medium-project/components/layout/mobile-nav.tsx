"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navLinks = [
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/profile", label: "Profile" },
];

export function MobileNav() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();

	return (
		<div className="md:hidden">
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setIsOpen(!isOpen)}
				className="brutal-border h-10 w-10"
			>
				{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</Button>

			{isOpen && (
				<div className="absolute left-0 right-0 top-16 z-50 border-b-2 border-foreground bg-background">
					<nav className="container flex flex-col px-4 py-2">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setIsOpen(false)}
								className={`brutal-border -mt-0.5 first:mt-0 px-4 py-3 font-mono font-bold uppercase transition-colors ${
									pathname === link.href
										? "bg-foreground text-background"
										: "hover:bg-muted"
								}`}
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>
			)}
		</div>
	);
}

export function DesktopNav() {
	const pathname = usePathname();

	return (
		<nav className="hidden md:flex items-center gap-0">
			{navLinks.map((link, index) => (
				<Link
					key={link.href}
					href={link.href}
					className={`brutal-border ${index > 0 ? "-ml-0.5" : ""} px-4 py-2 font-mono font-bold uppercase transition-colors ${
						pathname === link.href
							? "bg-foreground text-background"
							: "hover:bg-foreground hover:text-background"
					}`}
				>
					{link.label}
				</Link>
			))}
		</nav>
	);
}
