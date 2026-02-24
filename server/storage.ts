import { 
  episodes, goals, transactions, wins, retros, crisisPlans, signals, partnerConnections, spendingSettings, messages,
  healthMetrics, medications, forumPosts, forumComments, financialGoals, goalTasks, partnerAlerts,
  incomeSources, bills, upcomingExpenses,
  type Episode, type InsertEpisode,
  type Goal, type InsertGoal,
  type GoalTask, type InsertGoalTask,
  type Transaction, type InsertTransaction,
  type Win, type InsertWin,
  type Retro, type InsertRetro,
  type CrisisPlan, type InsertCrisisPlan,
  type Signal, type PartnerConnection, type SpendingSettings,
  type Message, type InsertMessage,
  type HealthMetric, type InsertHealthMetric,
  type Medication, type InsertMedication,
  type ForumPost, type InsertForumPost,
  type ForumComment, type InsertForumComment,
  type FinancialGoal, type InsertFinancialGoal,
  type PartnerAlert, type InsertPartnerAlert,
  type IncomeSource, type InsertIncomeSource,
  type Bill, type InsertBill,
  type UpcomingExpense, type InsertUpcomingExpense
} from "@shared/schema";
import { users } from "@shared/models/auth";
import { db } from "./db";
import { eq, desc, or, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // Episodes
  getEpisodes(userId: string): Promise<Episode[]>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  
  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, progress: number): Promise<Goal | undefined>;
  updateGoalDetails(id: string, data: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<void>;
  archiveGoal(id: string): Promise<Goal | undefined>;
  
  getArchivedGoals(userId: string): Promise<Goal[]>;
  
  // Goal Tasks
  getGoalTasks(goalId: string): Promise<GoalTask[]>;
  createGoalTask(task: InsertGoalTask): Promise<GoalTask>;
  toggleGoalTask(id: string): Promise<GoalTask | undefined>;
  deleteGoalTask(id: string): Promise<void>;
  
  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  getArchivedTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<void>;
  archiveTransaction(id: string): Promise<Transaction | undefined>;
  
  // Wins
  getWins(userId: string): Promise<Win[]>;
  getArchivedWins(userId: string): Promise<Win[]>;
  createWin(win: InsertWin): Promise<Win>;
  updateWin(id: string, text: string): Promise<Win | undefined>;
  deleteWin(id: string): Promise<void>;
  archiveWin(id: string): Promise<Win | undefined>;
  
  // Retros
  getRetros(userId: string): Promise<Retro[]>;
  createRetro(retro: InsertRetro): Promise<Retro>;
  updateRetro(id: string, data: Partial<InsertRetro>): Promise<Retro | undefined>;
  deleteRetro(id: string): Promise<void>;
  
  // Crisis Plan
  getCrisisPlan(userId: string): Promise<CrisisPlan | undefined>;
  upsertCrisisPlan(plan: InsertCrisisPlan): Promise<CrisisPlan>;
  
  // Signal
  getSignal(userId: string): Promise<Signal | undefined>;
  updateSignal(userId: string, status: string): Promise<Signal>;
  
  // Partner Connection / Invites
  getAcceptedConnection(userId: string): Promise<PartnerConnection | undefined>;
  getReceivedInvites(userId: string): Promise<any[]>;
  getSentInvites(userId: string): Promise<PartnerConnection[]>;
  sendInvite(fromUserId: string, toUserId: string): Promise<PartnerConnection>;
  respondToInvite(inviteId: string, userId: string, accept: boolean): Promise<PartnerConnection | null>;
  disconnectPartner(userId: string): Promise<void>;
  
  // User lookup
  getUserById(id: string): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  updateUserProfile(id: string, data: { firstName?: string; lastName?: string }): Promise<any | undefined>;
  searchUsers(query: string): Promise<any[]>;
  
  // Spending Settings
  getSpendingSettings(userId: string): Promise<SpendingSettings | undefined>;
  updateSpendingSettings(userId: string, limit: number, sensitive: boolean): Promise<SpendingSettings>;
  
  // Messages
  getMessages(connectionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Health Metrics
  getHealthMetrics(userId: string): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  deleteHealthMetric(id: string): Promise<void>;

  // Medications
  getMedications(userId: string): Promise<Medication[]>;
  createMedication(med: InsertMedication): Promise<Medication>;
  updateMedication(id: string, data: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: string): Promise<void>;

  // Forum Posts
  getForumPosts(): Promise<(ForumPost & { commentCount: number })[]>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  deleteForumPost(id: string): Promise<void>;

  // Forum Comments
  getForumComments(postId: string): Promise<ForumComment[]>;
  createForumComment(comment: InsertForumComment): Promise<ForumComment>;
  deleteForumComment(id: string): Promise<void>;

  // Financial Goals
  getFinancialGoals(userId: string): Promise<FinancialGoal[]>;
  createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: string, data: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined>;
  deleteFinancialGoal(id: string): Promise<void>;
  archiveFinancialGoal(id: string): Promise<FinancialGoal | undefined>;

  // Income Sources
  getIncomeSources(userId: string): Promise<IncomeSource[]>;
  createIncomeSource(source: InsertIncomeSource): Promise<IncomeSource>;
  updateIncomeSource(id: string, data: Partial<InsertIncomeSource>): Promise<IncomeSource | undefined>;
  deleteIncomeSource(id: string): Promise<void>;

  // Bills
  getBills(userId: string): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: string, data: Partial<InsertBill>): Promise<Bill | undefined>;
  deleteBill(id: string): Promise<void>;

  // Upcoming Expenses
  getUpcomingExpenses(userId: string): Promise<UpcomingExpense[]>;
  createUpcomingExpense(expense: InsertUpcomingExpense): Promise<UpcomingExpense>;
  updateUpcomingExpense(id: string, data: Partial<InsertUpcomingExpense>): Promise<UpcomingExpense | undefined>;
  deleteUpcomingExpense(id: string): Promise<void>;

  // Partner Alerts
  getAlertsSentByUser(userId: string): Promise<PartnerAlert[]>;
  getAlertsForUser(userId: string): Promise<PartnerAlert[]>;
  getLastAlertTime(userId: string): Promise<Date | null>;
  createAlert(alert: InsertPartnerAlert): Promise<PartnerAlert>;
  acknowledgeAlert(id: string): Promise<PartnerAlert | undefined>;
  getUnacknowledgedAlerts(userId: string): Promise<PartnerAlert[]>;
}

export class DatabaseStorage implements IStorage {
  // Episodes
  async getEpisodes(userId: string): Promise<Episode[]> {
    return db.select().from(episodes).where(eq(episodes.userId, userId)).orderBy(desc(episodes.date));
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const [created] = await db.insert(episodes).values(episode).returning();
    return created;
  }

  // Goals
  async getGoals(userId: string): Promise<Goal[]> {
    return db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.archived, false))).orderBy(desc(goals.createdAt));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values(goal).returning();
    return created;
  }

  async updateGoal(id: string, progress: number): Promise<Goal | undefined> {
    const [updated] = await db.update(goals).set({ progress }).where(eq(goals.id, id)).returning();
    return updated;
  }

  async updateGoalDetails(id: string, data: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await db.update(goals).set(data).where(eq(goals.id, id)).returning();
    return updated;
  }

  async deleteGoal(id: string): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async archiveGoal(id: string): Promise<Goal | undefined> {
    const [updated] = await db.update(goals).set({ archived: true }).where(eq(goals.id, id)).returning();
    return updated;
  }

  async getArchivedGoals(userId: string): Promise<Goal[]> {
    return db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.archived, true))).orderBy(desc(goals.createdAt));
  }

  // Goal Tasks
  async getGoalTasks(goalId: string): Promise<GoalTask[]> {
    return db.select().from(goalTasks).where(eq(goalTasks.goalId, goalId)).orderBy(goalTasks.createdAt);
  }

  async createGoalTask(task: InsertGoalTask): Promise<GoalTask> {
    const [created] = await db.insert(goalTasks).values(task).returning();
    return created;
  }

  async toggleGoalTask(id: string): Promise<GoalTask | undefined> {
    const [existing] = await db.select().from(goalTasks).where(eq(goalTasks.id, id));
    if (!existing) return undefined;
    const [updated] = await db.update(goalTasks).set({ completed: !existing.completed }).where(eq(goalTasks.id, id)).returning();
    return updated;
  }

  async deleteGoalTask(id: string): Promise<void> {
    await db.delete(goalTasks).where(eq(goalTasks.id, id));
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.archived, false))).orderBy(desc(transactions.date));
  }

  async getArchivedTransactions(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.archived, true))).orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async archiveTransaction(id: string): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions).set({ archived: true }).where(eq(transactions.id, id)).returning();
    return updated;
  }

  // Wins
  async getWins(userId: string): Promise<Win[]> {
    return db.select().from(wins).where(and(eq(wins.userId, userId), eq(wins.archived, false))).orderBy(desc(wins.date));
  }

  async getArchivedWins(userId: string): Promise<Win[]> {
    return db.select().from(wins).where(and(eq(wins.userId, userId), eq(wins.archived, true))).orderBy(desc(wins.date));
  }

  async createWin(win: InsertWin): Promise<Win> {
    const [created] = await db.insert(wins).values(win).returning();
    return created;
  }

  async updateWin(id: string, text: string): Promise<Win | undefined> {
    const [updated] = await db.update(wins).set({ text }).where(eq(wins.id, id)).returning();
    return updated;
  }

  async deleteWin(id: string): Promise<void> {
    await db.delete(wins).where(eq(wins.id, id));
  }

  async archiveWin(id: string): Promise<Win | undefined> {
    const [updated] = await db.update(wins).set({ archived: true }).where(eq(wins.id, id)).returning();
    return updated;
  }

  // Retros
  async getRetros(userId: string): Promise<Retro[]> {
    return db.select().from(retros).where(eq(retros.userId, userId)).orderBy(desc(retros.date));
  }

  async createRetro(retro: InsertRetro): Promise<Retro> {
    const [created] = await db.insert(retros).values(retro).returning();
    return created;
  }

  async updateRetro(id: string, data: Partial<InsertRetro>): Promise<Retro | undefined> {
    const [updated] = await db.update(retros).set(data).where(eq(retros.id, id)).returning();
    return updated;
  }

  async deleteRetro(id: string): Promise<void> {
    await db.delete(retros).where(eq(retros.id, id));
  }

  // Crisis Plan
  async getCrisisPlan(userId: string): Promise<CrisisPlan | undefined> {
    const [plan] = await db.select().from(crisisPlans).where(eq(crisisPlans.userId, userId));
    return plan;
  }

  async upsertCrisisPlan(plan: InsertCrisisPlan): Promise<CrisisPlan> {
    const [upserted] = await db
      .insert(crisisPlans)
      .values(plan)
      .onConflictDoUpdate({
        target: crisisPlans.userId,
        set: {
          triggers: plan.triggers,
          deescalation: plan.deescalation,
          immediateActions: plan.immediateActions,
          contact: plan.contact,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  // Signal
  async getSignal(userId: string): Promise<Signal | undefined> {
    const [signal] = await db.select().from(signals).where(eq(signals.userId, userId));
    return signal;
  }

  async updateSignal(userId: string, status: string): Promise<Signal> {
    const existing = await this.getSignal(userId);
    if (existing) {
      const [updated] = await db.update(signals).set({ status, updatedAt: new Date() }).where(eq(signals.userId, userId)).returning();
      return updated;
    }
    const [created] = await db.insert(signals).values({ userId, status }).returning();
    return created;
  }

  // Partner Connection / Invites
  async getAcceptedConnection(userId: string): Promise<PartnerConnection | undefined> {
    const [conn] = await db.select().from(partnerConnections)
      .where(and(
        or(eq(partnerConnections.fromUserId, userId), eq(partnerConnections.toUserId, userId)),
        eq(partnerConnections.status, 'accepted')
      ));
    return conn;
  }

  async getReceivedInvites(userId: string): Promise<any[]> {
    const invites = await db.select({
      invite: partnerConnections,
      fromUser: users
    })
    .from(partnerConnections)
    .innerJoin(users, eq(partnerConnections.fromUserId, users.id))
    .where(and(
      eq(partnerConnections.toUserId, userId),
      eq(partnerConnections.status, 'pending')
    ))
    .orderBy(desc(partnerConnections.createdAt));
    return invites;
  }

  async getSentInvites(userId: string): Promise<PartnerConnection[]> {
    return db.select().from(partnerConnections)
      .where(and(
        eq(partnerConnections.fromUserId, userId),
        eq(partnerConnections.status, 'pending')
      ))
      .orderBy(desc(partnerConnections.createdAt));
  }

  async sendInvite(fromUserId: string, toUserId: string): Promise<PartnerConnection> {
    const [created] = await db.insert(partnerConnections).values({
      fromUserId,
      toUserId,
      status: 'pending',
    }).returning();
    return created;
  }

  async respondToInvite(inviteId: string, userId: string, accept: boolean): Promise<PartnerConnection | null> {
    const [invite] = await db.select().from(partnerConnections).where(eq(partnerConnections.id, inviteId));
    if (!invite || invite.toUserId !== userId) {
      return null;
    }
    const [updated] = await db.update(partnerConnections)
      .set({ status: accept ? 'accepted' : 'declined' })
      .where(eq(partnerConnections.id, inviteId))
      .returning();
    return updated;
  }

  async disconnectPartner(userId: string): Promise<void> {
    await db.delete(partnerConnections).where(
      or(eq(partnerConnections.fromUserId, userId), eq(partnerConnections.toUserId, userId))
    );
  }

  // User lookup
  async getUserById(id: string): Promise<any | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    }).from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserProfile(id: string, data: { firstName?: string; lastName?: string }): Promise<any | undefined> {
    const [updated] = await db.update(users).set({
      firstName: data.firstName,
      lastName: data.lastName,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    });
    return updated;
  }

  async searchUsers(query: string): Promise<any[]> {
    const results = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    }).from(users);
    
    const lowerQuery = query.toLowerCase();
    return results.filter(u => 
      u.email?.toLowerCase().includes(lowerQuery) ||
      u.firstName?.toLowerCase().includes(lowerQuery) ||
      u.lastName?.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  }

  // Spending Settings
  async getSpendingSettings(userId: string): Promise<SpendingSettings | undefined> {
    const [settings] = await db.select().from(spendingSettings).where(eq(spendingSettings.userId, userId));
    return settings;
  }

  async updateSpendingSettings(userId: string, limit: number, sensitive: boolean): Promise<SpendingSettings> {
    const existing = await this.getSpendingSettings(userId);
    if (existing) {
      const [updated] = await db.update(spendingSettings).set({ spendingLimit: limit, isSpendingSensitive: sensitive }).where(eq(spendingSettings.userId, userId)).returning();
      return updated;
    }
    const [created] = await db.insert(spendingSettings).values({ userId, spendingLimit: limit, isSpendingSensitive: sensitive }).returning();
    return created;
  }

  // Messages
  async getMessages(connectionId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.connectionId, connectionId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  // Health Metrics
  async getHealthMetrics(userId: string): Promise<HealthMetric[]> {
    return db.select().from(healthMetrics).where(eq(healthMetrics.userId, userId)).orderBy(desc(healthMetrics.date));
  }

  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const [created] = await db.insert(healthMetrics).values(metric).returning();
    return created;
  }

  async deleteHealthMetric(id: string): Promise<void> {
    await db.delete(healthMetrics).where(eq(healthMetrics.id, id));
  }

  // Medications
  async getMedications(userId: string): Promise<Medication[]> {
    return db.select().from(medications).where(eq(medications.userId, userId)).orderBy(desc(medications.createdAt));
  }

  async createMedication(med: InsertMedication): Promise<Medication> {
    const [created] = await db.insert(medications).values(med).returning();
    return created;
  }

  async updateMedication(id: string, data: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updated] = await db.update(medications).set(data).where(eq(medications.id, id)).returning();
    return updated;
  }

  async deleteMedication(id: string): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  // Forum Posts
  async getForumPosts(): Promise<(ForumPost & { commentCount: number })[]> {
    const rows = await db
      .select({
        id: forumPosts.id,
        userId: forumPosts.userId,
        title: forumPosts.title,
        content: forumPosts.content,
        category: forumPosts.category,
        anonymous: forumPosts.anonymous,
        createdAt: forumPosts.createdAt,
        commentCount: count(forumComments.id),
      })
      .from(forumPosts)
      .leftJoin(forumComments, eq(forumPosts.id, forumComments.postId))
      .groupBy(forumPosts.id)
      .orderBy(desc(forumPosts.createdAt));
    return rows.map(r => ({ ...r, commentCount: Number(r.commentCount) }));
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [created] = await db.insert(forumPosts).values(post).returning();
    return created;
  }

  async deleteForumPost(id: string): Promise<void> {
    await db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  // Forum Comments
  async getForumComments(postId: string): Promise<ForumComment[]> {
    return db.select().from(forumComments).where(eq(forumComments.postId, postId)).orderBy(forumComments.createdAt);
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const [created] = await db.insert(forumComments).values(comment).returning();
    return created;
  }

  async deleteForumComment(id: string): Promise<void> {
    await db.delete(forumComments).where(eq(forumComments.id, id));
  }

  // Financial Goals
  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    return db.select().from(financialGoals).where(and(eq(financialGoals.userId, userId), eq(financialGoals.archived, false))).orderBy(desc(financialGoals.createdAt));
  }

  async createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal> {
    const [created] = await db.insert(financialGoals).values(goal).returning();
    return created;
  }

  async updateFinancialGoal(id: string, data: Partial<InsertFinancialGoal>): Promise<FinancialGoal | undefined> {
    const [updated] = await db.update(financialGoals).set(data).where(eq(financialGoals.id, id)).returning();
    return updated;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    await db.delete(financialGoals).where(eq(financialGoals.id, id));
  }

  async archiveFinancialGoal(id: string): Promise<FinancialGoal | undefined> {
    const [updated] = await db.update(financialGoals).set({ archived: true }).where(eq(financialGoals.id, id)).returning();
    return updated;
  }

  // Income Sources
  async getIncomeSources(userId: string): Promise<IncomeSource[]> {
    return db.select().from(incomeSources).where(and(eq(incomeSources.userId, userId), eq(incomeSources.active, true))).orderBy(desc(incomeSources.createdAt));
  }

  async createIncomeSource(source: InsertIncomeSource): Promise<IncomeSource> {
    const [created] = await db.insert(incomeSources).values(source).returning();
    return created;
  }

  async updateIncomeSource(id: string, data: Partial<InsertIncomeSource>): Promise<IncomeSource | undefined> {
    const [updated] = await db.update(incomeSources).set(data).where(eq(incomeSources.id, id)).returning();
    return updated;
  }

  async deleteIncomeSource(id: string): Promise<void> {
    await db.delete(incomeSources).where(eq(incomeSources.id, id));
  }

  // Bills
  async getBills(userId: string): Promise<Bill[]> {
    return db.select().from(bills).where(and(eq(bills.userId, userId), eq(bills.active, true))).orderBy(desc(bills.createdAt));
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const [created] = await db.insert(bills).values(bill).returning();
    return created;
  }

  async updateBill(id: string, data: Partial<InsertBill>): Promise<Bill | undefined> {
    const [updated] = await db.update(bills).set(data).where(eq(bills.id, id)).returning();
    return updated;
  }

  async deleteBill(id: string): Promise<void> {
    await db.delete(bills).where(eq(bills.id, id));
  }

  // Upcoming Expenses
  async getUpcomingExpenses(userId: string): Promise<UpcomingExpense[]> {
    return db.select().from(upcomingExpenses).where(and(eq(upcomingExpenses.userId, userId), sql`${upcomingExpenses.status} != 'paid'`)).orderBy(desc(upcomingExpenses.createdAt));
  }

  async createUpcomingExpense(expense: InsertUpcomingExpense): Promise<UpcomingExpense> {
    const [created] = await db.insert(upcomingExpenses).values(expense).returning();
    return created;
  }

  async updateUpcomingExpense(id: string, data: Partial<InsertUpcomingExpense>): Promise<UpcomingExpense | undefined> {
    const [updated] = await db.update(upcomingExpenses).set(data).where(eq(upcomingExpenses.id, id)).returning();
    return updated;
  }

  async deleteUpcomingExpense(id: string): Promise<void> {
    await db.delete(upcomingExpenses).where(eq(upcomingExpenses.id, id));
  }

  // Partner Alerts
  async getAlertsSentByUser(userId: string): Promise<PartnerAlert[]> {
    return db.select().from(partnerAlerts).where(eq(partnerAlerts.fromUserId, userId)).orderBy(desc(partnerAlerts.createdAt));
  }

  async getAlertsForUser(userId: string): Promise<PartnerAlert[]> {
    return db.select().from(partnerAlerts).where(eq(partnerAlerts.toUserId, userId)).orderBy(desc(partnerAlerts.createdAt));
  }

  async getLastAlertTime(userId: string): Promise<Date | null> {
    const [last] = await db.select({ createdAt: partnerAlerts.createdAt }).from(partnerAlerts).where(eq(partnerAlerts.fromUserId, userId)).orderBy(desc(partnerAlerts.createdAt)).limit(1);
    return last?.createdAt ?? null;
  }

  async createAlert(alert: InsertPartnerAlert): Promise<PartnerAlert> {
    const [created] = await db.insert(partnerAlerts).values(alert).returning();
    return created;
  }

  async acknowledgeAlert(id: string): Promise<PartnerAlert | undefined> {
    const [updated] = await db.update(partnerAlerts).set({ acknowledged: true }).where(eq(partnerAlerts.id, id)).returning();
    return updated;
  }

  async getUnacknowledgedAlerts(userId: string): Promise<PartnerAlert[]> {
    return db.select().from(partnerAlerts).where(and(eq(partnerAlerts.toUserId, userId), eq(partnerAlerts.acknowledged, false))).orderBy(desc(partnerAlerts.createdAt));
  }
}

export const storage = new DatabaseStorage();
