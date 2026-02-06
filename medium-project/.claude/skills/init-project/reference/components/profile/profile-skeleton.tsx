export function ProfileSkeleton() {
	return (
		<div className="space-y-8 animate-pulse">
			{/* Avatar Skeleton */}
			<div className="flex items-center gap-6">
				<div className="w-24 h-24 brutal-border bg-muted" />
				<div className="space-y-2">
					<div className="h-10 w-36 brutal-border bg-muted" />
					<div className="h-4 w-40 bg-muted" />
				</div>
			</div>

			{/* Form Skeleton */}
			<div className="space-y-6">
				<div className="space-y-2">
					<div className="h-4 w-20 bg-muted" />
					<div className="h-12 w-full brutal-border bg-muted" />
				</div>
				<div className="space-y-2">
					<div className="h-4 w-16 bg-muted" />
					<div className="h-12 w-full brutal-border bg-muted" />
				</div>
				<div className="h-12 w-32 brutal-border brutal-shadow bg-muted" />
			</div>
		</div>
	);
}
