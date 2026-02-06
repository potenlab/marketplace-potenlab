import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">Sign in</CardTitle>
					<CardDescription>
						Choose your preferred sign in method
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<OAuthButtons />

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<Suspense fallback={<div>Loading...</div>}>
						<LoginForm />
					</Suspense>
				</CardContent>
				<CardFooter className="flex flex-col space-y-2">
					<div className="text-sm text-muted-foreground text-center">
						<Link
							href="/magic-link"
							className="hover:text-primary underline underline-offset-4"
						>
							Sign in with magic link
						</Link>
					</div>
					<div className="text-sm text-muted-foreground text-center">
						Don&apos;t have an account?{" "}
						<Link
							href="/signup"
							className="hover:text-primary underline underline-offset-4"
						>
							Sign up
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
