'use server';
/**
 * @fileOverview A Genkit flow for prioritizing tasks within a workspace.
 *
 * - aiTaskPrioritization - A function that leverages AI to prioritize tasks based on various factors.
 * - PrioritizeTasksInput - The input type for the aiTaskPrioritization function.
 * - PrioritizeTasksOutput - The return type for the aiTaskPrioritization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task.'),
  description: z.string().describe('A detailed description of the task.'),
  dueDate: z
    .string()
    .optional()
    .describe('Optional due date for the task, e.g., "YYYY-MM-DD" or "tomorrow".'),
  notes: z
    .string()
    .optional()
    .describe('Any additional notes or context for the task.'),
});

const PrioritizeTasksInputSchema = z.object({
  workspaceName: z.string().describe('The name of the workspace to which the tasks belong.'),
  tasks: z.array(TaskSchema).describe('An array of tasks to be prioritized.'),
});
export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizedTaskOutputSchema = z.object({
  id: z.string().describe('The unique identifier of the task.'),
  priority: z
    .number()
    .int()
    .min(1)
    .describe('The assigned priority of the task, where 1 is the highest priority.'),
  reasoning: z.string().describe('A brief explanation for the assigned priority.'),
});

const PrioritizeTasksOutputSchema = z.object({
  prioritizedTasks: z
    .array(PrioritizedTaskOutputSchema)
    .describe('An array of tasks sorted by their assigned priority.'),
});
export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function aiTaskPrioritization(
  input: PrioritizeTasksInput
): Promise<PrioritizeTasksOutput> {
  return aiTaskPrioritizationFlow(input);
}

const prioritizeTasksPrompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are an AI task prioritization assistant. Your goal is to analyze a list of tasks within a workspace and suggest an optimal order of priority.
Consider the following factors when prioritizing:
-   Due dates (earlier due dates generally mean higher priority)
-   Content of the notes (notes might indicate urgency or importance)
-   The task description itself.

The output should be a JSON object with a single field 'prioritizedTasks', which is an array of tasks. Each task in the array should have an 'id', a 'priority' field (where '1' is the highest priority), and a 'reasoning' field (a brief explanation for the assigned priority).

Workspace: {{{workspaceName}}}

Tasks:
{{#each tasks}}
- ID: {{this.id}}
  Description: {{this.description}}
  {{#if this.dueDate}}Due Date: {{this.dueDate}}{{/if}}
  {{#if this.notes}}Notes: {{this.notes}}{{/if}}
{{/each}}
`,
});

const aiTaskPrioritizationFlow = ai.defineFlow(
  {
    name: 'aiTaskPrioritizationFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prioritizeTasksPrompt(input);
    if (!output) {
      throw new Error('Failed to get a valid response from the prioritization prompt.');
    }
    // Ensure tasks are sorted by priority if the model doesn't guarantee it
    output.prioritizedTasks.sort((a, b) => a.priority - b.priority);
    return output;
  }
);
