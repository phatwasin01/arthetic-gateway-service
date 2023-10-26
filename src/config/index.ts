import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
  JWT_SECRET: z.string().optional(),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  USER_SERVICE_URL: z.string().optional(),
  POST_SERVICE_URL: z.string().optional(),
});

export const config = envSchema.parse(process.env);
