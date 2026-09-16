import { z } from "zod";

export const reorderPhotosSchema = z
  .object({
    orders: z
      .array(
        z
          .object({
            photoId: z.string().uuid("Invalid photo ID"),
            displayOrder: z.number().int().min(0).max(20)
          })
          .strict()
      )
      .min(1, "At least one photo order must be specified")
      .max(20)
  })
  .strict();

export const updatePhotoSchema = z
  .object({
    displayOrder: z.number().int().min(0).max(20).optional()
  })
  .strict();

export type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>;
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;
