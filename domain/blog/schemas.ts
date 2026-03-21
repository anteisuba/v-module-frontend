import { z } from "zod";

const externalLinkSchema = z.object({
  url: z.string().min(1),
  label: z.string().min(1),
});

export const createBlogPostInputSchema = z.object({
  title: z.string().trim().min(1, "标题必填"),
  content: z.string().trim().min(1, "内容必填"),
  coverImage: z.string().nullable().optional().transform((v) => v || null),
  videoUrl: z.string().nullable().optional().transform((v) => v || null),
  externalLinks: z
    .array(externalLinkSchema)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  published: z.boolean().optional().default(false),
});

export const updateBlogPostInputSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).optional(),
  coverImage: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  externalLinks: z.array(externalLinkSchema).nullable().optional(),
  published: z.boolean().optional(),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;
