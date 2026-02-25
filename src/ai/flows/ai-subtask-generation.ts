'use server';
/**
 * @fileOverview An AI agent for generating subtasks from a given task description.
 *
 * - generateSubtasks - A function that handles the subtask generation process.
 * - AiSubtaskGenerationInput - The input type for the generateSubtasks function.
 * - AiSubtaskGenerationOutput - The return type for the generateSubtasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSubtaskGenerationInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the main task for which to generate subtasks.'),
});
export type AiSubtaskGenerationInput = z.infer<
  typeof AiSubtaskGenerationInputSchema
>;

const AiSubtaskGenerationOutputSchema = z.object({
  subtasks: z.array(z.string()).describe('An array of suggested subtasks.'),
});
export type AiSubtaskGenerationOutput = z.infer<
  typeof AiSubtaskGenerationOutputSchema
>;

export async function generateSubtasks(
  input: AiSubtaskGenerationInput
): Promise<AiSubtaskGenerationOutput> {
  return aiSubtaskGenerationFlow(input);
}

const aiSubtaskGenerationPrompt = ai.definePrompt({
  name: 'aiSubtaskGenerationPrompt',
  input: {schema: AiSubtaskGenerationInputSchema},
  output: {schema: AiSubtaskGenerationOutputSchema},
  prompt: `You are an AI assistant that helps users break down larger tasks into smaller, more manageable subtasks.

Given the following main task description, generate a list of relevant subtasks.

Main Task: {{{taskDescription}}}

Ensure the subtasks are clear, actionable, and directly related to completing the main task.
`,
});

const aiSubtaskGenerationFlow = ai.defineFlow(
  {
    name: 'aiSubtaskGenerationFlow',
    inputSchema: AiSubtaskGenerationInputSchema,
    outputSchema: AiSubtaskGenerationOutputSchema,
  },
  async input => {
    const {output} = await aiSubtaskGenerationPrompt(input);
    return output!;
  }
);
