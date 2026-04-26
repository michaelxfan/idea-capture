import { z } from "zod";

export const interpretationSchema = z.object({
  a_intention: z.string().min(1).max(240),
  b_intention: z.string().min(1).max(240),
  threshold_type: z.enum([
    "time",
    "energy",
    "ambiguity",
    "emotional_discomfort",
    "social_risk",
    "uncertainty",
    "friction",
    "mixed",
    "unclear",
  ]),
  threshold_description: z.string().min(1).max(400),
  current_mode: z.enum(["A", "B", "mixed", "unclear"]),
  evidence: z.string().min(1).max(600),
  b_classification: z.enum([
    "strategic",
    "protective",
    "avoidant",
    "healthy",
    "mixed",
    "unclear",
  ]),
  recommendation: z.string().min(1).max(400),
  minimum_viable_a: z.string().min(1).max(300),
});

export type Interpretation = z.infer<typeof interpretationSchema>;

export const captureInputSchema = z.object({
  situation_text: z.string().min(4).max(4000),
  domain: z
    .enum(["work", "health", "social", "admin", "creative", "personal"])
    .nullable()
    .optional(),
  time_available_minutes: z.number().int().positive().nullable().optional(),
  energy_level: z.enum(["low", "medium", "high"]).nullable().optional(),
  emotional_tone: z
    .enum(["calm", "resistant", "anxious", "tired", "excited", "unclear"])
    .nullable()
    .optional(),
  stakes: z.enum(["low", "medium", "high"]).nullable().optional(),
});

export type CaptureInput = z.infer<typeof captureInputSchema>;
