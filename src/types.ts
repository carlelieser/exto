import {z} from 'zod';

export const linkSchema = z.object({
	label: z.string().min(1),
	href: z.url(),
	magnet: z.string().regex(/^magnet:\?xt=urn:btih:[a-zA-Z0-9]+(?:&.*)?$/, {
		message: "Invalid magnet link"
	})
});

export type Link = z.infer<typeof linkSchema>;

export type OutputFormat = 'json' | 'csv' | 'raw';

export interface ScraperOptions {
	id: string;
	res: string;
	season: number;
	start: number;
	end?: number;
	label?: string;
	limit?: number;
	out?: string;
	dump?: boolean;
	format: OutputFormat;
	extract: string[];
	concurrency?: number;
	headless: boolean;
}
