'use server';
/**
 * @fileOverview AI flow for analyzing emotional episodes and suggesting coping strategies.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WellnessAnalysisInputSchema = z.object({
  notes: z.string().describe('The user\'s notes about their emotional state.'),
  intensity: z.number().describe('The intensity of the episode (1-10).'),
});
export type WellnessAnalysisInput = z.infer<typeof WellnessAnalysisInputSchema>;

const WellnessAnalysisOutputSchema = z.object({
  suggestedTriggers: z.array(z.string()).describe('Potential triggers identified from the notes.'),
  copingStrategies: z.array(z.string()).describe('Recommended coping strategies based on the intensity and notes.'),
  moodCategory: z.string().describe('A brief categorization of the mood (e.g., "High Sensitivity", "Depressive Dip").'),
  insight: z.string().describe('A compassionate AI-generated insight about the current state.'),
});
export type WellnessAnalysisOutput = z.infer<typeof WellnessAnalysisOutputSchema>;

export async function analyzeWellnessEpisode(input: WellnessAnalysisInput): Promise<WellnessAnalysisOutput> {
  return wellnessAnalysisFlow(input);
}

const wellnessAnalysisPrompt = ai.definePrompt({
  name: 'wellnessAnalysisPrompt',
  input: {schema: WellnessAnalysisInputSchema},
  output: {schema: WellnessAnalysisOutputSchema},
  prompt: `You are a compassionate mental health AI assistant specialized in BPD and Bipolar support. 
Analyze the user's check-in notes and intensity level to provide helpful suggestions.

Intensity: {{intensity}}/10
Notes: {{{notes}}}

Identify potential triggers mentioned or implied. 
Suggest evidence-based coping strategies (like DBT techniques) appropriate for this intensity level.
Provide a short, supportive insight.
`,
});

const wellnessAnalysisFlow = ai.defineFlow(
  {
    name: 'wellnessAnalysisFlow',
    inputSchema: WellnessAnalysisInputSchema,
    outputSchema: WellnessAnalysisOutputSchema,
  },
  async input => {
    const {output} = await wellnessAnalysisPrompt(input);
    if (!output) throw new Error("AI failed to generate analysis.");
    return output;
  }
);
