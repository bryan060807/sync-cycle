import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

import { users } from "./models/auth";

export const partnerConnections = pgTable("partner_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  toEmail: varchar("to_email"),
  toPhone: varchar("to_phone"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const signals = pgTable("signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 10 }).notNull().default("green"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow(),
  intensity: integer("intensity").notNull(),
  trigger: text("trigger"),
  notes: text("notes"),
  emotion: varchar("emotion", { length: 20 }),
  isContributed: boolean("is_contributed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  progress: integer("progress").notNull().default(0),
  targetDate: timestamp("target_date"),
  category: varchar("category", { length: 20 }),
  assignedTo: varchar("assigned_to", { length: 10 }),
  goalType: varchar("goal_type", { length: 20 }).default("short-term"),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalTasks = pgTable("goal_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  category: varchar("category", { length: 50 }),
  paidBy: varchar("paid_by", { length: 10 }),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crisisPlans = pgTable("crisis_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  triggers: jsonb("triggers").$type<string[]>().default([]),
  deescalation: jsonb("deescalation").$type<string[]>().default([]),
  immediateActions: jsonb("immediate_actions").$type<string[]>().default([]),
  copingStrategies: jsonb("coping_strategies").$type<string[]>().default([]),
  safeWord: text("safe_word"),
  contact: text("contact"),
  secondaryContact: text("secondary_contact"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wins = pgTable("wins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  author: varchar("author", { length: 100 }),
  text: text("text").notNull(),
  archived: boolean("archived").default(false),
  date: timestamp("date").defaultNow(),
});

export const retros = pgTable("retros", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow(),
  wentWell: text("went_well"),
  disconnected: text("disconnected"),
  nextSteps: text("next_steps"),
  mood: integer("mood"),
  archived: boolean("archived").default(false),
});

export const spendingSettings = pgTable("spending_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  spendingLimit: real("spending_limit").default(200),
  isSpendingSensitive: boolean("is_spending_sensitive").default(true),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => partnerConnections.id),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthMetrics = pgTable("health_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow(),
  weight: real("weight"),
  bpSystolic: integer("bp_systolic"),
  bpDiastolic: integer("bp_diastolic"),
  bloodSugar: real("blood_sugar"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage"),
  schedule: text("schedule"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 30 }),
  anonymous: boolean("anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumComments = pgTable("forum_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  anonymous: boolean("anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const incomeSources = pgTable("income_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  cadence: varchar("cadence", { length: 20 }).notNull().default("monthly"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  cadence: varchar("cadence", { length: 20 }).notNull().default("monthly"),
  dueDay: integer("due_day"),
  category: varchar("category", { length: 30 }),
  autopay: boolean("autopay").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const upcomingExpenses = pgTable("upcoming_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  dueDate: timestamp("due_date"),
  category: varchar("category", { length: 30 }),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financialGoals = pgTable("financial_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").default(0),
  category: varchar("category", { length: 30 }),
  goalType: varchar("goal_type", { length: 20 }).default("savings"),
  dueDate: timestamp("due_date"),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const partnerAlerts = pgTable("partner_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  alertType: varchar("alert_type", { length: 20 }).notNull(),
  message: text("message"),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true, createdAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export const insertGoalTaskSchema = createInsertSchema(goalTasks).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertWinSchema = createInsertSchema(wins).omit({ id: true });
export const insertRetroSchema = createInsertSchema(retros).omit({ id: true });
export const insertCrisisPlanSchema = createInsertSchema(crisisPlans).omit({ id: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({ id: true, createdAt: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true });
export const insertForumCommentSchema = createInsertSchema(forumComments).omit({ id: true, createdAt: true });
export const insertIncomeSourceSchema = createInsertSchema(incomeSources).omit({ id: true, createdAt: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true, createdAt: true });
export const insertUpcomingExpenseSchema = createInsertSchema(upcomingExpenses).omit({ id: true, createdAt: true });
export const insertFinancialGoalSchema = createInsertSchema(financialGoals).omit({ id: true, createdAt: true });
export const insertPartnerAlertSchema = createInsertSchema(partnerAlerts).omit({ id: true, createdAt: true });

// Types
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type GoalTask = typeof goalTasks.$inferSelect;
export type InsertGoalTask = z.infer<typeof insertGoalTaskSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Win = typeof wins.$inferSelect;
export type InsertWin = z.infer<typeof insertWinSchema>;
export type Retro = typeof retros.$inferSelect;
export type InsertRetro = z.infer<typeof insertRetroSchema>;
export type CrisisPlan = typeof crisisPlans.$inferSelect;
export type InsertCrisisPlan = z.infer<typeof insertCrisisPlanSchema>;
export type Signal = typeof signals.$inferSelect;
export type PartnerConnection = typeof partnerConnections.$inferSelect;
export type SpendingSettings = typeof spendingSettings.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;
export type IncomeSource = typeof incomeSources.$inferSelect;
export type InsertIncomeSource = z.infer<typeof insertIncomeSourceSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type UpcomingExpense = typeof upcomingExpenses.$inferSelect;
export type InsertUpcomingExpense = z.infer<typeof insertUpcomingExpenseSchema>;
export type FinancialGoal = typeof financialGoals.$inferSelect;
export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type PartnerAlert = typeof partnerAlerts.$inferSelect;
export type InsertPartnerAlert = z.infer<typeof insertPartnerAlertSchema>;
