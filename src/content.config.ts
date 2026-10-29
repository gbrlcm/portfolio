import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string().min(1, 'O título é obrigatório'),
		description: z.string().min(1, 'A descrição é obrigatória'),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		author: z.string().default('Gabriel Campos'),
		cover: z.string().optional(),
		coverAlt: z.string().optional(),
		category: z.string().min(1, 'A categoria é obrigatória'),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
		lang: z
			.enum(['pt-BR', 'pt-br', 'en', 'es'])
			.default('pt-BR')
			.transform((val) => (val.toLowerCase() === 'pt-br' ? 'pt-BR' : val) as 'pt-BR' | 'en' | 'es'),
		translationKey: z.string().optional(),
	}),
});

export const collections = { blog };
