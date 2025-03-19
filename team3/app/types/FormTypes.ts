import { z } from "zod";
import { LoginFormSchema, EventCreationFormSchema } from "@/app/schema";

export type LoginFormInput = z.infer<typeof LoginFormSchema>;
export type EventCreationFormInput = z.infer<typeof EventCreationFormSchema>;

