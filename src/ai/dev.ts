import { config } from 'dotenv';
config();

import '@/ai/flows/ai-subtask-generation.ts';
import '@/ai/flows/ai-task-prioritization-flow.ts';
import '@/ai/flows/wellness-analysis-flow.ts';
import '@/ai/flows/aggregate-insights-flow.ts';
