"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { useState } from "react";
import { Toaster } from "sonner";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// With SSR, we usually want to set some default staleTime
						// above 0 to avoid refetching immediately on the client
						staleTime: 60 * 1000, // 1 minute
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<NuqsAdapter>
				{children}
				<Toaster position="top-right" richColors closeButton />
			</NuqsAdapter>
		</QueryClientProvider>
	);
}
