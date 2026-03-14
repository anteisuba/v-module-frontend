import { z } from "zod";

const requiredTrimmedString = z.string().trim().min(1);
const optionalTrimmedString = z.string().trim().min(1).optional();
const nullableTrimmedString = z.string().trim().min(1).nullable().optional();

export const newsShareChannelSchema = z.object({
  platform: requiredTrimmedString,
  enabled: z.boolean(),
});

export const newsArticleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: optionalTrimmedString,
  published: z
    .enum(["true", "false", "null"])
    .optional()
    .transform((value) => {
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      if (value === "null") {
        return null;
      }

      return undefined;
    }),
});

export const createNewsArticleInputSchema = z.object({
  title: requiredTrimmedString,
  content: requiredTrimmedString,
  category: requiredTrimmedString,
  tag: nullableTrimmedString,
  shareUrl: nullableTrimmedString,
  shareChannels: z.array(newsShareChannelSchema).nullable().optional(),
  published: z.boolean().optional().default(false),
  backgroundType: z.enum(["color", "image"]).optional().default("color"),
  backgroundValue: requiredTrimmedString.optional().default("#000000"),
});

export const updateNewsArticleInputSchema = z
  .object({
    title: optionalTrimmedString,
    content: optionalTrimmedString,
    category: optionalTrimmedString,
    tag: nullableTrimmedString,
    shareUrl: nullableTrimmedString,
    shareChannels: z.array(newsShareChannelSchema).nullable().optional(),
    published: z.boolean().optional(),
    backgroundType: z.enum(["color", "image"]).nullable().optional(),
    backgroundValue: nullableTrimmedString,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type NewsArticleListQueryInput = z.infer<typeof newsArticleListQuerySchema>;
export type CreateNewsArticleInput = z.infer<typeof createNewsArticleInputSchema>;
export type UpdateNewsArticleInput = z.infer<typeof updateNewsArticleInputSchema>;
