import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function MagicLinkPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">Magic Link</CardTitle>
					<CardDescription>
						Sign in with a magic link sent to your email
					</CardDescription>
				</CardHeader>
				<CardContent>
					<MagicLinkForm />
				</CardContent>
				<CardFooter className="flex flex-col space-y-2">
					<div className="text-sm text-muted-foreground text-center">
						<Link
							href="/login"
							className="hover:text-primary underline underline-offset-4"
						>
							Back to sign in
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
