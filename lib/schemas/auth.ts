import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .trim()
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>; 