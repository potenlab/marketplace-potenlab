import Link from "next/link";

export default function DashboardPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="font-mono text-2xl md:text-3xl font-bold uppercase">
					Dashboard
				</h1>
				<p className="font-mono text-sm text-muted-foreground">
					Welcome to your app
				</p>
			</div>

			<div className="brutal-border brutal-shadow bg-background p-6 md:p-8">
				<h2 className="font-mono text-xl font-bold uppercase mb-4">
					Getting Started
				</h2>
				<p className="font-mono text-muted-foreground mb-6">
					This is a clean Next.js + Supabase boilerplate. Start building your
					app by editing this page.
				</p>
				<div className="grid gap-4 sm:grid-cols-2">
					<Link
						href="/profile"
						className="brutal-border bg-muted/30 p-4 font-mono text-sm font-bold uppercase hover:bg-foreground hover:text-background transition-colors"
					>
						Edit Profile
					</Link>
					<a
						href="https://supabase.com/docs"
						target="_blank"
						rel="noopener noreferrer"
						className="brutal-border bg-muted/30 p-4 font-mono text-sm font-bold uppercase hover:bg-foreground hover:text-background transition-colors"
					>
						Supabase Docs
					</a>
				</div>
			</div>
		</div>
	);
}
