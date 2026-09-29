import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const groups = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './content/groups' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    order: z.number(),
    tagline: z.string(),
    description: z.string(),
    color: z.string(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/events' }),
  schema: z.object({
    title: z.string(),
    event_date: z.coerce.date(),
    created_at: z.string(),
    group: z.string(),
    type: z.string(),
    location: z.string().optional(),
    description: z.string(),
    content: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
    registration: z.string().optional(),
  }),
});

const members = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './content/members' }),
  schema: z.object({
    name: z.string(),
    group: z.string().optional(),
    role: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    contact: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

const showcase = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './content/showcase' }),
  schema: z.object({
    title: z.string(),
    group: z.string(),
    date: z.date(),
    description: z.string(),
    related_event: z.string().optional(),
    cover_image: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/announcements' }),
  schema: z.object({
    title: z.string(),
    created_at: z.string(),
    content: z.string(),
    active: z.boolean().default(false),
  }),
});

export const collections = {
  groups,
  events,
  members,
  showcase,
  announcements
};