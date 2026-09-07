import * as z from "zod";

export const UserLogin = z.object({
    teamId: z.number().multipleOf(1),
    password: z.string().trim().nonempty(),
});

export const EvaluationName = z.object({
    name: z.string().trim().nonempty(),
});

export const TeamNamePassword = z.object({
    name: z.string().trim().nonempty(),
    password: z.string(),
})