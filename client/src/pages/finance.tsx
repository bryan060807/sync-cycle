import Layout from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Wallet, TrendingUp, TrendingDown, Receipt, CalendarClock, Sparkles, Trash2, Pencil, Target, DollarSign, Clock, Calculator } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { IncomeSource, Bill, UpcomingExpense, FinancialGoal, Transaction } from "@shared/schema";

const BILL_CATEGORIES = ["Housing", "Utilities", "Insurance", "Subscriptions", "Transportation", "Phone/Internet", "Other"];
const EXPENSE_CATEGORIES = ["Travel", "Concert", "Event", "Shopping", "Medical", "Education", "Home", "Other"];
const GOAL_TYPES = [
  { value: "savings", label: "Savings" },
  { value: "trip", label: "Trip / Vacation" },
  { value: "concert", label: "Concert / Event" },
  { value: "purchase", label: "Big Purchase" },
  { value: "emergency", label: "Emergency Fund" },
  { value: "other", label: "Other" },
];

function normalizeToMonthly(amount: number, cadence: string): number {
  switch (cadence) {
    case "weekly": return amount * 4.33;
    case "biweekly": return amount * 2.17;
    case "monthly": return amount;
    case "quarterly": return amount / 3;
    case "yearly": return amount / 12;
    default: return amount;
  }
}

function getBreakdown(amount: number, dueDate: Date | null | undefined) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const daysLeft = Math.max(1, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  return {
    daysLeft,
    daily: amount / daysLeft,
    weekly: amount / weeksLeft,
    monthly: amount / monthsLeft,
  };
}

function BreakdownBadges({ amount, dueDate }: { amount: number; dueDate: Date | null | undefined }) {
  const breakdown = getBreakdown(amount, dueDate);
  if (!breakdown) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <Badge variant="outline" className="text-[10px] font-normal gap-1 border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-400">
        <Calculator className="h-2.5 w-2.5" />
        ${breakdown.daily.toFixed(2)}/day
      </Badge>
      <Badge variant="outline" className="text-[10px] font-normal gap-1 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
        ${breakdown.weekly.toFixed(2)}/week
      </Badge>
      <Badge variant="outline" className="text-[10px] font-normal gap-1 border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-400">
        ${breakdown.monthly.toFixed(2)}/month
      </Badge>
      <Badge variant="outline" className="text-[10px] font-normal gap-1 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400">
        <Clock className="h-2.5 w-2.5" />
        {breakdown.daysLeft} days left
      </Badge>
    </div>
  );
}

export default function Finance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [incomeDialog, setIncomeDialog] = useState(false);
  const [billDialog, setBillDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [goalDialog, setGoalDialog] = useState(false);
  const [transactionDialog, setTransactionDialog] = useState(false);

  const [newIncome, setNewIncome] = useState({ name: "", amount: "", cadence: "monthly" });
  const [newBill, setNewBill] = useState({ name: "", amount: "", cadence: "monthly", dueDay: "", category: "Other", autopay: false });
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", dueDate: "", category: "Other", notes: "" });
  const [newGoal, setNewGoal] = useState({ title: "", targetAmount: "", category: "Savings", goalType: "savings", dueDate: "" });
  const [newTransaction, setNewTransaction] = useState({ description: "", amount: "", type: "income", category: "Other" });
  const [updateGoalId, setUpdateGoalId] = useState<string | null>(null);
  const [updateGoalAmount, setUpdateGoalAmount] = useState("");

  const { data: incomeSources = [] } = useQuery<IncomeSource[]>({
    queryKey: ["/api/income-sources"],
    queryFn: () => apiRequest("GET", "/api/income-sources").then(r => r.json()),
  });

  const { data: userBills = [] } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
    queryFn: () => apiRequest("GET", "/api/bills").then(r => r.json()),
  });

  const { data: upcomingExpenses = [] } = useQuery<UpcomingExpense[]>({
    queryKey: ["/api/upcoming-expenses"],
    queryFn: () => apiRequest("GET", "/api/upcoming-expenses").then(r => r.json()),
  });

  const { data: financialGoals = [] } = useQuery<FinancialGoal[]>({
    queryKey: ["/api/financial-goals"],
    queryFn: () => apiRequest("GET", "/api/financial-goals").then(r => r.json()),
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("GET", "/api/transactions").then(r => r.json()),
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/income-sources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income-sources"] });
      setIncomeDialog(false);
      setNewIncome({ name: "", amount: "", cadence: "monthly" });
      toast({ title: "Income source added!" });
    },
    onError: () => toast({ title: "Couldn't add income source", variant: "destructive" }),
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/income-sources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income-sources"] });
      toast({ title: "Income source removed" });
    },
  });

  const createBillMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/bills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setBillDialog(false);
      setNewBill({ name: "", amount: "", cadence: "monthly", dueDay: "", category: "Other", autopay: false });
      toast({ title: "Bill added!" });
    },
    onError: () => toast({ title: "Couldn't add bill", variant: "destructive" }),
  });

  const deleteBillMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      toast({ title: "Bill removed" });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/upcoming-expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upcoming-expenses"] });
      setExpenseDialog(false);
      setNewExpense({ name: "", amount: "", dueDate: "", category: "Other", notes: "" });
      toast({ title: "Upcoming expense added!" });
    },
    onError: () => toast({ title: "Couldn't add expense", variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/upcoming-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upcoming-expenses"] });
      toast({ title: "Expense removed" });
    },
  });

  const markExpensePaidMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/upcoming-expenses/${id}`, { status: "paid" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upcoming-expenses"] });
      toast({ title: "Marked as paid!" });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/financial-goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      setGoalDialog(false);
      setNewGoal({ title: "", targetAmount: "", category: "Savings", goalType: "savings", dueDate: "" });
      toast({ title: "Goal created!" });
    },
    onError: () => toast({ title: "Couldn't create goal", variant: "destructive" }),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/financial-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      setUpdateGoalId(null);
      setUpdateGoalAmount("");
      toast({ title: "Goal updated!" });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/financial-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      toast({ title: "Goal removed" });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setTransactionDialog(false);
      setNewTransaction({ description: "", amount: "", type: "income", category: "Other" });
      toast({ title: "Transaction recorded!" });
    },
    onError: () => toast({ title: "Couldn't record transaction", variant: "destructive" }),
  });

  const monthlyIncome = incomeSources.reduce((sum, s) => sum + normalizeToMonthly(s.amount, s.cadence), 0);
  const monthlyBills = userBills.reduce((sum, b) => sum + normalizeToMonthly(b.amount, b.cadence), 0);
  const upcomingTotal = upcomingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyBalance = monthlyIncome - monthlyBills;

  const totalRecordedIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalRecordedExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
  const actualBalance = totalRecordedIncome - totalRecordedExpenses;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="text-finance-title">Budget</h1>
            <p className="text-muted-foreground mt-1">Plan your finances together.</p>
          </div>
          <Dialog open={transactionDialog} onOpenChange={setTransactionDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20" size="sm" data-testid="button-add-transaction">
                <Plus className="h-4 w-4" /> Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <Button
                    variant={newTransaction.type === "income" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setNewTransaction({ ...newTransaction, type: "income" })}
                    data-testid="button-type-income"
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1" /> Income
                  </Button>
                  <Button
                    variant={newTransaction.type === "expense" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setNewTransaction({ ...newTransaction, type: "expense" })}
                    data-testid="button-type-expense"
                  >
                    <TrendingDown className="h-3.5 w-3.5 mr-1" /> Expense
                  </Button>
                </div>
                <Input
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  data-testid="input-transaction-description"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  data-testid="input-transaction-amount"
                />
                <Button
                  onClick={() => createTransactionMutation.mutate({
                    description: newTransaction.description,
                    amount: parseFloat(newTransaction.amount),
                    type: newTransaction.type,
                    category: newTransaction.category,
                  })}
                  className="w-full"
                  disabled={!newTransaction.description || !newTransaction.amount || createTransactionMutation.isPending}
                  data-testid="button-save-transaction"
                >
                  Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Monthly Income</p>
                  <div className="text-3xl font-bold mt-1" data-testid="text-monthly-income">${monthlyIncome.toFixed(2)}</div>
                  <p className="text-xs opacity-70 mt-1">{incomeSources.length} source{incomeSources.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-none shadow-xl">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Monthly Bills</p>
                  <div className="text-3xl font-bold mt-1" data-testid="text-monthly-bills">${monthlyBills.toFixed(2)}</div>
                  <p className="text-xs opacity-70 mt-1">{userBills.length} bill{userBills.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-none shadow-xl text-white",
            monthlyBalance >= 0
              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
              : "bg-gradient-to-br from-amber-500 to-orange-600"
          )}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Monthly Balance</p>
                  <div className="text-3xl font-bold mt-1" data-testid="text-monthly-balance">
                    {monthlyBalance >= 0 ? "+" : ""}${monthlyBalance.toFixed(2)}
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    {monthlyBalance >= 0 ? "Looking healthy" : "Spending exceeds income"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {actualBalance !== 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Recorded Balance</p>
                    <p className="text-xs text-muted-foreground">
                      ${totalRecordedIncome.toFixed(2)} in - ${totalRecordedExpenses.toFixed(2)} out
                    </p>
                  </div>
                </div>
                <div className={cn("text-xl font-bold", actualBalance >= 0 ? "text-emerald-600" : "text-rose-600")} data-testid="text-actual-balance">
                  {actualBalance >= 0 ? "+" : ""}${actualBalance.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Income Sources
                </CardTitle>
                <Dialog open={incomeDialog} onOpenChange={setIncomeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 h-8" data-testid="button-add-income">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Income Source</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Source name (e.g. Salary, Freelance)"
                        value={newIncome.name}
                        onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                        data-testid="input-income-name"
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newIncome.amount}
                        onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                        data-testid="input-income-amount"
                      />
                      <Select value={newIncome.cadence} onValueChange={(v) => setNewIncome({ ...newIncome, cadence: v })}>
                        <SelectTrigger data-testid="select-income-cadence"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => createIncomeMutation.mutate({ name: newIncome.name, amount: parseFloat(newIncome.amount), cadence: newIncome.cadence })}
                        className="w-full"
                        disabled={!newIncome.name || !newIncome.amount || createIncomeMutation.isPending}
                        data-testid="button-save-income"
                      >
                        Add Income Source
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {incomeSources.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No income sources yet. Add your first one!</p>
              ) : (
                <div className="space-y-2">
                  {incomeSources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group" data-testid={`income-source-${source.id}`}>
                      <div>
                        <p className="font-medium text-sm">{source.name}</p>
                        <p className="text-xs text-muted-foreground">${source.amount.toFixed(2)} / {source.cadence}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-emerald-600">${normalizeToMonthly(source.amount, source.cadence).toFixed(2)}/mo</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteIncomeMutation.mutate(source.id)}
                          data-testid={`button-delete-income-${source.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-rose-600" />
                  Bills & Recurring
                </CardTitle>
                <Dialog open={billDialog} onOpenChange={setBillDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 h-8" data-testid="button-add-bill">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Bill name (e.g. Rent, Netflix)"
                        value={newBill.name}
                        onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                        data-testid="input-bill-name"
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newBill.amount}
                        onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                        data-testid="input-bill-amount"
                      />
                      <Select value={newBill.cadence} onValueChange={(v) => setNewBill({ ...newBill, cadence: v })}>
                        <SelectTrigger data-testid="select-bill-cadence"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Due day of month (1-31)"
                        min={1}
                        max={31}
                        value={newBill.dueDay}
                        onChange={(e) => setNewBill({ ...newBill, dueDay: e.target.value })}
                        data-testid="input-bill-due-day"
                      />
                      <Select value={newBill.category} onValueChange={(v) => setNewBill({ ...newBill, category: v })}>
                        <SelectTrigger data-testid="select-bill-category"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BILL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newBill.autopay}
                          onCheckedChange={(checked) => setNewBill({ ...newBill, autopay: checked })}
                          data-testid="switch-bill-autopay"
                        />
                        <span className="text-sm text-muted-foreground">Autopay enabled</span>
                      </div>
                      <Button
                        onClick={() => createBillMutation.mutate({
                          name: newBill.name,
                          amount: parseFloat(newBill.amount),
                          cadence: newBill.cadence,
                          dueDay: newBill.dueDay ? parseInt(newBill.dueDay) : null,
                          category: newBill.category,
                          autopay: newBill.autopay,
                        })}
                        className="w-full"
                        disabled={!newBill.name || !newBill.amount || createBillMutation.isPending}
                        data-testid="button-save-bill"
                      >
                        Add Bill
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {userBills.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No bills set up yet.</p>
              ) : (
                <div className="space-y-2">
                  {userBills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group" data-testid={`bill-${bill.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{bill.name}</p>
                          {bill.autopay && <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600">Autopay</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">${bill.amount.toFixed(2)} / {bill.cadence}</span>
                          {bill.dueDay && <span className="text-xs text-muted-foreground">- Due {bill.dueDay}{getDaySuffix(bill.dueDay)}</span>}
                          {bill.category && <Badge variant="secondary" className="text-[10px] h-4">{bill.category}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-rose-600">${normalizeToMonthly(bill.amount, bill.cadence).toFixed(2)}/mo</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteBillMutation.mutate(bill.id)}
                          data-testid={`button-delete-bill-${bill.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  Upcoming Expenses
                </CardTitle>
                <CardDescription className="mt-1">One-time expenses coming up. Each shows how much to set aside daily, weekly, or monthly.</CardDescription>
              </div>
              <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 h-8" data-testid="button-add-expense">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Upcoming Expense</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="What's the expense? (e.g. Car repair)"
                      value={newExpense.name}
                      onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                      data-testid="input-expense-name"
                    />
                    <Input
                      type="number"
                      placeholder="Amount needed"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      data-testid="input-expense-amount"
                    />
                    <Input
                      type="date"
                      value={newExpense.dueDate}
                      onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                      data-testid="input-expense-due-date"
                    />
                    <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                      <SelectTrigger data-testid="select-expense-category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Notes (optional)"
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                      data-testid="input-expense-notes"
                    />
                    <Button
                      onClick={() => createExpenseMutation.mutate({
                        name: newExpense.name,
                        amount: parseFloat(newExpense.amount),
                        dueDate: newExpense.dueDate ? new Date(newExpense.dueDate).toISOString() : null,
                        category: newExpense.category,
                        notes: newExpense.notes || null,
                      })}
                      className="w-full"
                      disabled={!newExpense.name || !newExpense.amount || createExpenseMutation.isPending}
                      data-testid="button-save-expense"
                    >
                      Add Expense
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No upcoming expenses planned.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingExpenses.map((expense) => (
                  <div key={expense.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group" data-testid={`expense-${expense.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{expense.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-amber-600">${expense.amount.toFixed(2)}</span>
                          {expense.category && <Badge variant="secondary" className="text-[10px] h-4">{expense.category}</Badge>}
                        </div>
                        {expense.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(expense.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {expense.notes && <p className="text-xs text-muted-foreground mt-1 italic">{expense.notes}</p>}
                        <BreakdownBadges amount={expense.amount} dueDate={expense.dueDate} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                          onClick={() => markExpensePaidMutation.mutate(expense.id)}
                          title="Mark as paid"
                          data-testid={`button-paid-expense-${expense.id}`}
                        >
                          <Checkbox className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  Savings Goals
                </CardTitle>
                <CardDescription className="mt-1">Trips, concerts, big purchases - with a savings plan breakdown.</CardDescription>
              </div>
              <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 h-8" data-testid="button-add-goal">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="What are you saving for?"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      data-testid="input-goal-title"
                    />
                    <Input
                      type="number"
                      placeholder="How much do you need?"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                      data-testid="input-goal-target"
                    />
                    <Select value={newGoal.goalType} onValueChange={(v) => setNewGoal({ ...newGoal, goalType: v })}>
                      <SelectTrigger data-testid="select-goal-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newGoal.dueDate}
                      onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                      data-testid="input-goal-due-date"
                    />
                    <Button
                      onClick={() => createGoalMutation.mutate({
                        title: newGoal.title,
                        targetAmount: parseFloat(newGoal.targetAmount),
                        goalType: newGoal.goalType,
                        category: newGoal.goalType,
                        dueDate: newGoal.dueDate ? new Date(newGoal.dueDate).toISOString() : null,
                      })}
                      className="w-full"
                      disabled={!newGoal.title || !newGoal.targetAmount || createGoalMutation.isPending}
                      data-testid="button-save-goal"
                    >
                      Create Goal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {financialGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No savings goals yet. Start planning something exciting!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {financialGoals.map((goal) => {
                  const progress = goal.targetAmount > 0 ? Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100) : 0;
                  const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
                  const goalLabel = GOAL_TYPES.find(t => t.value === goal.goalType)?.label || goal.goalType || "Savings";
                  return (
                    <div key={goal.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 hover:shadow-md transition-all group" data-testid={`goal-${goal.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{goal.title}</h3>
                            <Badge variant="outline" className="text-[10px]">{goalLabel}</Badge>
                          </div>
                          {goal.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: {new Date(goal.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          data-testid={`button-delete-goal-${goal.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">${(goal.currentAmount || 0).toFixed(2)}</span>
                          <span className="font-medium">${goal.targetAmount.toFixed(2)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}% saved</p>
                      </div>

                      {remaining > 0 && <BreakdownBadges amount={remaining} dueDate={goal.dueDate} />}

                      {updateGoalId === goal.id ? (
                        <div className="flex gap-2 mt-3">
                          <Input
                            type="number"
                            placeholder="New saved amount"
                            value={updateGoalAmount}
                            onChange={(e) => setUpdateGoalAmount(e.target.value)}
                            className="h-8 text-sm"
                            data-testid={`input-update-goal-${goal.id}`}
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => updateGoalMutation.mutate({ id: goal.id, data: { currentAmount: parseFloat(updateGoalAmount) } })}
                            disabled={!updateGoalAmount}
                            data-testid={`button-confirm-goal-${goal.id}`}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setUpdateGoalId(null); setUpdateGoalAmount(""); }}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1.5 text-xs mt-3"
                          onClick={() => { setUpdateGoalId(goal.id); setUpdateGoalAmount((goal.currentAmount || 0).toString()); }}
                          data-testid={`button-update-goal-${goal.id}`}
                        >
                          <TrendingUp className="h-3.5 w-3.5" /> Update Progress
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {transactions.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors" data-testid={`transaction-${t.id}`}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        t.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {t.type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{t.date ? new Date(t.date).toLocaleDateString() : "Today"}</p>
                      </div>
                    </div>
                    <span className={cn("font-bold text-sm", t.type === "income" ? "text-emerald-600" : "text-rose-600")}>
                      {t.type === "income" ? "+" : "-"}${(t.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
