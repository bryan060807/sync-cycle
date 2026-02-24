import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { 
  insertEpisodeSchema, 
  insertGoalSchema, 
  insertGoalTaskSchema,
  insertTransactionSchema,
  insertWinSchema,
  insertRetroSchema,
  insertCrisisPlanSchema,
  insertMessageSchema,
  insertHealthMetricSchema,
  insertMedicationSchema,
  insertForumPostSchema,
  insertForumCommentSchema,
  insertFinancialGoalSchema,
  insertIncomeSourceSchema,
  insertBillSchema,
  insertUpcomingExpenseSchema
} from "@shared/schema";
import { z } from "zod";
import { sendPartnerInviteEmail, sendAlertEmail } from "./email";
import { getUncachableTodoistClient } from "./todoist";

const sendInviteSchema = z.object({
  toUserId: z.string().min(1),
});

const sendEmailInviteSchema = z.object({
  email: z.string().email(),
});

const respondInviteSchema = z.object({
  accept: z.boolean(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Episodes
  app.get("/api/episodes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const episodes = await storage.getEpisodes(userId);
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });

  app.post("/api/episodes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertEpisodeSchema.parse({ ...req.body, userId });
      const episode = await storage.createEpisode(parsed);
      res.json(episode);
    } catch (error) {
      res.status(400).json({ message: "Invalid episode data" });
    }
  });

  // Goals
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/archived", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getArchivedGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch archived goals" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = { ...req.body, userId };
      // Handle targetDate - convert ISO string to Date or set to null
      if (data.targetDate) {
        data.targetDate = new Date(data.targetDate);
      } else {
        data.targetDate = null;
      }
      const parsed = insertGoalSchema.parse(data);
      const goal = await storage.createGoal(parsed);
      res.json(goal);
    } catch (error) {
      console.error("Goal creation error:", error);
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  app.patch("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      if (data.targetDate) {
        data.targetDate = new Date(data.targetDate);
      }
      if (data.progress !== undefined) {
        const goal = await storage.updateGoal(id, data.progress);
        if (!goal) return res.status(404).json({ message: "Goal not found" });
        return res.json(goal);
      }
      const goal = await storage.updateGoalDetails(id, data);
      if (!goal) return res.status(404).json({ message: "Goal not found" });
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGoal(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete goal" });
    }
  });

  app.post("/api/goals/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const goal = await storage.archiveGoal(id);
      if (!goal) return res.status(404).json({ message: "Goal not found" });
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Failed to archive goal" });
    }
  });

  // Goal Tasks
  app.get("/api/goals/:goalId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const { goalId } = req.params;
      const tasks = await storage.getGoalTasks(goalId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goal tasks" });
    }
  });

  app.post("/api/goals/:goalId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const { goalId } = req.params;
      const parsed = insertGoalTaskSchema.parse({ goalId, title: req.body.title });
      const task = await storage.createGoalTask(parsed);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.patch("/api/goal-tasks/:id/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const task = await storage.toggleGoalTask(id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Failed to toggle task" });
    }
  });

  app.delete("/api/goal-tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGoalTask(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete task" });
    }
  });

  // Transactions
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/archived", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const archived = await storage.getArchivedTransactions(userId);
      res.json(archived);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch archived transactions" });
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertTransactionSchema.parse({ ...req.body, userId });
      const transaction = await storage.createTransaction(parsed);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.patch("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.updateTransaction(id, req.body);
      if (!transaction) return res.status(404).json({ message: "Transaction not found" });
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTransaction(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete transaction" });
    }
  });

  app.post("/api/transactions/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.archiveTransaction(id);
      if (!transaction) return res.status(404).json({ message: "Transaction not found" });
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Failed to archive transaction" });
    }
  });

  // Wins
  app.get("/api/wins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wins = await storage.getWins(userId);
      res.json(wins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wins" });
    }
  });

  app.get("/api/wins/archived", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wins = await storage.getArchivedWins(userId);
      res.json(wins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch archived wins" });
    }
  });

  app.post("/api/wins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertWinSchema.parse({ ...req.body, userId });
      const win = await storage.createWin(parsed);
      res.json(win);
    } catch (error) {
      res.status(400).json({ message: "Invalid win data" });
    }
  });

  app.patch("/api/wins/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const win = await storage.updateWin(id, text);
      if (!win) return res.status(404).json({ message: "Win not found" });
      res.json(win);
    } catch (error) {
      res.status(400).json({ message: "Failed to update win" });
    }
  });

  app.delete("/api/wins/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWin(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete win" });
    }
  });

  app.post("/api/wins/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const win = await storage.archiveWin(id);
      if (!win) return res.status(404).json({ message: "Win not found" });
      res.json(win);
    } catch (error) {
      res.status(400).json({ message: "Failed to archive win" });
    }
  });

  // Retros
  app.get("/api/retros", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const retros = await storage.getRetros(userId);
      res.json(retros);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch retros" });
    }
  });

  app.post("/api/retros", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertRetroSchema.parse({ ...req.body, userId });
      const retro = await storage.createRetro(parsed);
      res.json(retro);
    } catch (error) {
      res.status(400).json({ message: "Invalid retro data" });
    }
  });

  app.patch("/api/retros/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { wentWell, disconnected, nextSteps, mood } = req.body;
      const retro = await storage.updateRetro(id, { wentWell, disconnected, nextSteps, mood });
      if (!retro) return res.status(404).json({ message: "Retro not found" });
      res.json(retro);
    } catch (error) {
      res.status(400).json({ message: "Failed to update retro" });
    }
  });

  app.delete("/api/retros/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRetro(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete retro" });
    }
  });

  // Crisis Plan
  app.get("/api/crisis-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plan = await storage.getCrisisPlan(userId);
      res.json(plan || { triggers: [], deescalation: [], immediateActions: [], copingStrategies: [], safeWord: "", contact: "", secondaryContact: "" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crisis plan" });
    }
  });

  app.put("/api/crisis-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertCrisisPlanSchema.parse({ ...req.body, userId });
      const plan = await storage.upsertCrisisPlan(parsed);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: "Invalid crisis plan data" });
    }
  });

  // Signal
  app.get("/api/signal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const signal = await storage.getSignal(userId);
      res.json(signal || { status: "green" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch signal" });
    }
  });

  app.put("/api/signal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.body;
      if (!["green", "yellow", "red"].includes(status)) {
        return res.status(400).json({ message: "Invalid signal status" });
      }
      const signal = await storage.updateSignal(userId, status);
      res.json(signal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update signal" });
    }
  });

  // Partner Connection
  app.get("/api/partner", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getAcceptedConnection(userId);
      if (connection) {
        const partnerId = connection.fromUserId === userId ? connection.toUserId : connection.fromUserId;
        const partner = partnerId ? await storage.getUserById(partnerId) : null;
        res.json({ connection, partner });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch partner connection" });
    }
  });

  app.delete("/api/partner", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.disconnectPartner(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to disconnect partner" });
    }
  });

  // Invites
  app.get("/api/invites/received", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invites = await storage.getReceivedInvites(userId);
      res.json(invites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch received invites" });
    }
  });

  app.get("/api/invites/sent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invites = await storage.getSentInvites(userId);
      res.json(invites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sent invites" });
    }
  });

  app.post("/api/invites", isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.claims.sub;
      const parsed = sendInviteSchema.parse(req.body);
      if (fromUserId === parsed.toUserId) {
        return res.status(400).json({ message: "Cannot invite yourself" });
      }
      const invite = await storage.sendInvite(fromUserId, parsed.toUserId);
      
      const toUser = await storage.getUserById(parsed.toUserId);
      const fromUser = await storage.getUserById(fromUserId);
      if (toUser?.email && fromUser) {
        const inviterName = fromUser.firstName || fromUser.email?.split('@')[0] || 'Someone';
        const inviteLink = `${req.headers.origin || 'https://' + req.headers.host}/invites`;
        await sendPartnerInviteEmail(toUser.email, inviterName, inviteLink);
      }
      
      res.json(invite);
    } catch (error) {
      res.status(400).json({ message: "Failed to send invite" });
    }
  });

  app.post("/api/invites/email", isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.claims.sub;
      const parsed = sendEmailInviteSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(parsed.email);
      const fromUser = await storage.getUserById(fromUserId);
      const inviterName = fromUser?.firstName || fromUser?.email?.split('@')[0] || 'Someone';
      const baseUrl = req.headers.origin || 'https://' + req.headers.host;
      
      if (existingUser) {
        if (existingUser.id === fromUserId) {
          return res.status(400).json({ message: "Cannot invite yourself" });
        }
        const invite = await storage.sendInvite(fromUserId, existingUser.id);
        const inviteLink = `${baseUrl}/invites`;
        await sendPartnerInviteEmail(parsed.email, inviterName, inviteLink);
        res.json({ invite, emailSent: true });
      } else {
        const inviteLink = `${baseUrl}/?ref=${fromUserId}`;
        const emailSent = await sendPartnerInviteEmail(parsed.email, inviterName, inviteLink);
        res.json({ emailSent, message: emailSent ? "Invitation email sent" : "Failed to send email" });
      }
    } catch (error) {
      res.status(400).json({ message: "Failed to send email invite" });
    }
  });

  app.post("/api/invites/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const parsed = respondInviteSchema.parse(req.body);
      const invite = await storage.respondToInvite(id, userId, parsed.accept);
      if (!invite) {
        return res.status(403).json({ message: "Not authorized to respond to this invite" });
      }
      res.json(invite);
    } catch (error) {
      res.status(400).json({ message: "Failed to respond to invite" });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;
      const updated = await storage.updateUserProfile(userId, { firstName, lastName });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // User search and public profiles
  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const users = await storage.searchUsers(query);
      const currentUserId = req.user.claims.sub;
      res.json(users.filter(u => u.id !== currentUserId));
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/:id/profile", async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Spending Settings
  app.get("/api/spending-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getSpendingSettings(userId);
      res.json(settings || { spendingLimit: 200, isSpendingSensitive: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spending settings" });
    }
  });

  app.put("/api/spending-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { spendingLimit, isSpendingSensitive } = req.body;
      const settings = await storage.updateSpendingSettings(userId, spendingLimit, isSpendingSensitive);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update spending settings" });
    }
  });

  // Messages
  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getAcceptedConnection(userId);
      if (!connection) {
        return res.json([]);
      }
      const messages = await storage.getMessages(connection.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getAcceptedConnection(userId);
      if (!connection) {
        return res.status(400).json({ message: "No active partner connection" });
      }
      const parsed = insertMessageSchema.parse({
        connectionId: connection.id,
        fromUserId: userId,
        text: req.body.text,
      });
      const message = await storage.createMessage(parsed);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Health Metrics
  app.get("/api/health-metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getHealthMetrics(userId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });

  app.post("/api/health-metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = { ...req.body, userId };
      if (data.date) {
        data.date = new Date(data.date);
      }
      const parsed = insertHealthMetricSchema.parse(data);
      const metric = await storage.createHealthMetric(parsed);
      res.json(metric);
    } catch (error) {
      res.status(400).json({ message: "Invalid health metric data" });
    }
  });

  app.delete("/api/health-metrics/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteHealthMetric(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete health metric" });
    }
  });

  // Medications
  app.get("/api/medications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meds = await storage.getMedications(userId);
      res.json(meds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertMedicationSchema.parse({ ...req.body, userId });
      const med = await storage.createMedication(parsed);
      res.json(med);
    } catch (error) {
      res.status(400).json({ message: "Invalid medication data" });
    }
  });

  app.patch("/api/medications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, dosage, schedule, active } = req.body;
      const med = await storage.updateMedication(id, { name, dosage, schedule, active });
      if (!med) return res.status(404).json({ message: "Medication not found" });
      res.json(med);
    } catch (error) {
      res.status(400).json({ message: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMedication(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete medication" });
    }
  });

  // Forum Posts
  app.get("/api/forum/posts", isAuthenticated, async (req: any, res) => {
    try {
      const posts = await storage.getForumPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.post("/api/forum/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, content, category, anonymous } = req.body;
      const parsed = insertForumPostSchema.parse({ userId, title, content, category, anonymous });
      const post = await storage.createForumPost(parsed);
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid forum post data" });
    }
  });

  app.delete("/api/forum/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const posts = await storage.getForumPosts();
      const post = posts.find(p => p.id === id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      if (post.userId !== userId) return res.status(403).json({ message: "Not authorized to delete this post" });
      await storage.deleteForumPost(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete forum post" });
    }
  });

  // Forum Comments
  app.get("/api/forum/posts/:postId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getForumComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/forum/posts/:postId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const { content, anonymous } = req.body;
      const parsed = insertForumCommentSchema.parse({ postId, userId, content, anonymous });
      const comment = await storage.createForumComment(parsed);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.delete("/api/forum/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const allPosts = await storage.getForumPosts();
      let found = false;
      for (const post of allPosts) {
        const comments = await storage.getForumComments(post.id);
        const comment = comments.find(c => c.id === id);
        if (comment) {
          if (comment.userId !== userId) return res.status(403).json({ message: "Not authorized to delete this comment" });
          found = true;
          break;
        }
      }
      if (!found) return res.status(404).json({ message: "Comment not found" });
      await storage.deleteForumComment(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete comment" });
    }
  });

  // Financial Goals
  app.get("/api/financial-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getFinancialGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch financial goals" });
    }
  });

  app.post("/api/financial-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertFinancialGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.createFinancialGoal(parsed);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid financial goal data" });
    }
  });

  app.patch("/api/financial-goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, targetAmount, currentAmount, category, goalType, dueDate } = req.body;
      const goal = await storage.updateFinancialGoal(id, { title, targetAmount, currentAmount, category, goalType, dueDate: dueDate ? new Date(dueDate) : undefined });
      if (!goal) return res.status(404).json({ message: "Financial goal not found" });
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Failed to update financial goal" });
    }
  });

  app.post("/api/financial-goals/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const goal = await storage.archiveFinancialGoal(id);
      if (!goal) return res.status(404).json({ message: "Financial goal not found" });
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Failed to archive financial goal" });
    }
  });

  app.delete("/api/financial-goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFinancialGoal(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete financial goal" });
    }
  });

  // Income Sources
  app.get("/api/income-sources", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sources = await storage.getIncomeSources(userId);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch income sources" });
    }
  });

  app.post("/api/income-sources", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertIncomeSourceSchema.parse({ ...req.body, userId });
      const source = await storage.createIncomeSource(parsed);
      res.json(source);
    } catch (error) {
      res.status(400).json({ message: "Invalid income source data" });
    }
  });

  app.patch("/api/income-sources/:id", isAuthenticated, async (req: any, res) => {
    try {
      const source = await storage.updateIncomeSource(req.params.id, req.body);
      if (!source) return res.status(404).json({ message: "Income source not found" });
      res.json(source);
    } catch (error) {
      res.status(400).json({ message: "Failed to update income source" });
    }
  });

  app.delete("/api/income-sources/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteIncomeSource(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete income source" });
    }
  });

  // Bills
  app.get("/api/bills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBills = await storage.getBills(userId);
      res.json(userBills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.post("/api/bills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertBillSchema.parse({ ...req.body, userId });
      const bill = await storage.createBill(parsed);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ message: "Invalid bill data" });
    }
  });

  app.patch("/api/bills/:id", isAuthenticated, async (req: any, res) => {
    try {
      const bill = await storage.updateBill(req.params.id, req.body);
      if (!bill) return res.status(404).json({ message: "Bill not found" });
      res.json(bill);
    } catch (error) {
      res.status(400).json({ message: "Failed to update bill" });
    }
  });

  app.delete("/api/bills/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBill(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete bill" });
    }
  });

  // Upcoming Expenses
  app.get("/api/upcoming-expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenses = await storage.getUpcomingExpenses(userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming expenses" });
    }
  });

  app.post("/api/upcoming-expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertUpcomingExpenseSchema.parse({ ...req.body, userId });
      const expense = await storage.createUpcomingExpense(parsed);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid upcoming expense data" });
    }
  });

  app.patch("/api/upcoming-expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const expense = await storage.updateUpcomingExpense(req.params.id, req.body);
      if (!expense) return res.status(404).json({ message: "Upcoming expense not found" });
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Failed to update upcoming expense" });
    }
  });

  app.delete("/api/upcoming-expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteUpcomingExpense(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete upcoming expense" });
    }
  });

  // Partner Alerts
  const ALERT_COOLDOWN_MS = 1800000;

  app.post("/api/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { alertType, message } = req.body;

      if (!["triggered", "safe_word", "overwhelmed"].includes(alertType)) {
        return res.status(400).json({ message: "Invalid alert type" });
      }

      const lastAlertTime = await storage.getLastAlertTime(userId);
      if (lastAlertTime) {
        const elapsed = Date.now() - lastAlertTime.getTime();
        if (elapsed < ALERT_COOLDOWN_MS) {
          return res.status(429).json({
            message: "Please wait before sending another alert",
            cooldownRemaining: ALERT_COOLDOWN_MS - elapsed,
          });
        }
      }

      const connection = await storage.getAcceptedConnection(userId);
      if (!connection) {
        return res.status(400).json({ message: "No active partner connection" });
      }

      const partnerId = connection.fromUserId === userId ? connection.toUserId : connection.fromUserId;
      if (!partnerId) {
        return res.status(400).json({ message: "Partner not found" });
      }

      const alert = await storage.createAlert({
        fromUserId: userId,
        toUserId: partnerId,
        alertType,
        message: message || null,
      });

      try {
        const partner = await storage.getUserById(partnerId);
        const fromUser = await storage.getUserById(userId);
        if (partner?.email && fromUser) {
          const fromName = fromUser.firstName || fromUser.email?.split('@')[0] || 'Your partner';
          await sendAlertEmail(partner.email, fromName, alertType, message);
        }
      } catch (emailErr) {
        console.error('Failed to send alert email:', emailErr);
      }

      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to send alert" });
    }
  });

  app.get("/api/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getUnacknowledgedAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/sent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getAlertsSentByUser(userId);
      res.json(alerts.slice(0, 10));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sent alerts" });
    }
  });

  app.post("/api/alerts/:id/acknowledge", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const alerts = await storage.getAlertsForUser(userId);
      const alert = alerts.find(a => a.id === id);
      if (!alert) {
        return res.status(403).json({ message: "Not authorized to acknowledge this alert" });
      }
      const updated = await storage.acknowledgeAlert(id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  app.get("/api/alerts/cooldown", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lastAlertTime = await storage.getLastAlertTime(userId);
      if (!lastAlertTime) {
        return res.json({ canSend: true, cooldownRemaining: 0 });
      }
      const elapsed = Date.now() - lastAlertTime.getTime();
      const remaining = Math.max(0, ALERT_COOLDOWN_MS - elapsed);
      res.json({ canSend: remaining === 0, cooldownRemaining: remaining });
    } catch (error) {
      res.status(500).json({ message: "Failed to check cooldown" });
    }
  });

  // Todoist integration - get tasks
  app.get("/api/todoist/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const api = await getUncachableTodoistClient();
      const response = await api.getTasks();
      const tasks = Array.isArray(response) ? response : (response as any).results || [];
      res.json(tasks);
    } catch (error: any) {
      console.error("Todoist get tasks error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Todoist tasks" });
    }
  });

  // Todoist - get projects
  app.get("/api/todoist/projects", isAuthenticated, async (req: any, res) => {
    try {
      const api = await getUncachableTodoistClient();
      const response = await api.getProjects();
      const projects = Array.isArray(response) ? response : (response as any).results || [];
      res.json(projects);
    } catch (error: any) {
      console.error("Todoist get projects error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Todoist projects" });
    }
  });

  // Todoist - add task
  const todoistTaskSchema = z.object({
    content: z.string().min(1, "Task content is required"),
    description: z.string().optional(),
    projectId: z.string().optional(),
    priority: z.number().min(1).max(4).optional(),
    dueString: z.string().optional(),
  });

  app.post("/api/todoist/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = todoistTaskSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const { content, description, projectId, priority, dueString } = parsed.data;
      const api = await getUncachableTodoistClient();
      const task = await api.addTask({
        content,
        description: description || undefined,
        projectId: projectId || undefined,
        priority: priority || undefined,
        dueString: dueString || undefined,
      });
      res.json(task);
    } catch (error: any) {
      console.error("Todoist add task error:", error);
      res.status(500).json({ message: error.message || "Failed to add Todoist task" });
    }
  });

  // Todoist - close (complete) task
  app.post("/api/todoist/tasks/:id/close", isAuthenticated, async (req: any, res) => {
    try {
      const api = await getUncachableTodoistClient();
      await api.closeTask(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Todoist close task error:", error);
      res.status(500).json({ message: error.message || "Failed to close Todoist task" });
    }
  });

  // Todoist - sync goal tasks to Todoist project
  app.post("/api/todoist/sync-goal/:goalId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoals(userId);
      const goal = goals.find(g => g.id === req.params.goalId);
      if (!goal) return res.status(404).json({ message: "Goal not found" });

      const tasks = await storage.getGoalTasks(goal.id);
      const api = await getUncachableTodoistClient();

      const project = await api.addProject({ name: `SyncCycle: ${goal.title}` });

      const created = [];
      for (const task of tasks) {
        if (!task.completed) {
          const todoistTask = await api.addTask({
            content: task.title,
            projectId: project.id,
          });
          created.push(todoistTask);
        }
      }

      res.json({ projectId: project.id, projectName: project.name, tasksCreated: created.length });
    } catch (error: any) {
      console.error("Todoist sync error:", error);
      res.status(500).json({ message: error.message || "Failed to sync to Todoist" });
    }
  });

  return httpServer;
}
