'use server';
/**
 * @fileOverview AI flow for generating weekly retrospective insights from user data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EpisodeDataSchema = z.object({
  intensity: z.number(),
  trigger: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
});

const WeeklyRetroInputSchema = z.object({
  episodes: z.array(EpisodeDataSchema).describe('The user\'s emotional logs for the past week.'),
});
export type WeeklyRetroInput = z.infer<typeof WeeklyRetroInputSchema>;

const WeeklyRetroOutputSchema = z.object({
  weeklySummary: z.string().describe('A summary of the user\'s week.'),
  identifiedPatterns: z.array(z.string()).describe('Common triggers or behavioral patterns identified.'),
  growthScore: z.number().min(0).max(100).describe('A relative score of emotional stability/growth this week.'),
  advice: z.string().describe('Actionable advice for the upcoming week.'),
});
export type WeeklyRetroOutput = z.infer<typeof WeeklyRetroOutputSchema>;

export async function generateWeeklyRetroAI(input: WeeklyRetroInput): Promise<WeeklyRetroOutput> {
  return weeklyRetroFlow(input);
}

const weeklyRetroPrompt = ai.definePrompt({
  name: 'weeklyRetroPrompt',
  input: {schema: WeeklyRetroInputSchema},
  output: {schema: WeeklyRetroOutputSchema},
  prompt: `You are a supportive mental health coach. Review the user's emotional logs for the past week and provide a deep retrospective.

Logs:
{{#each episodes}}
- Intensity: {{this.intensity}}/10 | Trigger: {{this.trigger}} | Notes: {{this.notes}}
{{/each}}

1. Summarize the emotional arc of the week.
2. Identify repeating triggers or patterns.
3. Provide a growth score (0-100) reflecting stability or progress.
4. Give compassionate, actionable advice for next week.
`,
});

const weeklyRetroFlow = ai.defineFlow(
  {
    name: 'weeklyRetroFlow',
    inputSchema: WeeklyRetroInputSchema,
    outputSchema: WeeklyRetroOutputSchema,
  },
  async input => {
    const {output} = await weeklyRetroPrompt(input);
    if (!output) throw new Error("AI failed to generate weekly insights.");
    return output;
  }
);
