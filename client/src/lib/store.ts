import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Auth Store ---

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  partnerName?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  connectionStatus: 'connected' | 'pending' | 'none';
}

export type SignalStatus = 'green' | 'yellow' | 'red';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  signal: SignalStatus;
  login: (email: string) => void;
  register: (email: string, name: string) => void;
  logout: () => void;
  setSignal: (status: SignalStatus) => void;
  updateProfile: (data: Partial<User>) => void;
  connectPartner: (emailOrPhone: string) => void;
  disconnectPartner: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      signal: 'green',
      login: (email) => set({ 
        isAuthenticated: true, 
        user: { 
          id: Math.random().toString(), 
          name: email.split('@')[0], 
          email,
          phone: '',
          partnerName: undefined,
          partnerEmail: undefined,
          connectionStatus: 'none'
        } 
      }),
      register: (email, name) => set({
        isAuthenticated: true,
        user: {
          id: Math.random().toString(),
          name,
          email,
          phone: '',
          partnerName: undefined,
          partnerEmail: undefined,
          connectionStatus: 'none'
        }
      }),
      logout: () => set({ isAuthenticated: false, user: null }),
      setSignal: (signal) => set({ signal }),
      updateProfile: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
      connectPartner: (emailOrPhone) => set((state) => ({
        user: state.user ? { 
          ...state.user, 
          partnerEmail: emailOrPhone.includes('@') ? emailOrPhone : state.user.partnerEmail,
          partnerPhone: !emailOrPhone.includes('@') ? emailOrPhone : state.user.partnerPhone,
          connectionStatus: 'pending' 
        } : null
      })),
      disconnectPartner: () => set((state) => ({
        user: state.user ? {
          ...state.user,
          partnerName: undefined,
          partnerEmail: undefined,
          partnerPhone: undefined,
          connectionStatus: 'none'
        } : null
      })),
    }),
    {
      name: 'synccycle-auth',
    }
  )
);

// --- Data Store (Mock Database) ---

export interface Episode {
  id: string;
  date: string;
  intensity: number; // 1-10
  trigger: string;
  notes: string;
  emotion: 'Anxious' | 'Angry' | 'Sad' | 'Manic' | 'Neutral' | 'Happy';
}

export interface Goal {
  id: string;
  title: string;
  progress: number; // 0-100
  targetDate: string;
  category: 'Wellness' | 'Finance' | 'Relationship' | 'Personal';
  assignedTo: 'Me' | 'Partner' | 'Both';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  paidBy: 'Me' | 'Partner' | 'Both';
}

export interface CrisisPlan {
  triggers: string[];
  deescalation: string[];
  immediateActions: string[];
  contact: string;
}

export interface Win {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface Retro {
  id: string;
  date: string;
  wentWell: string;
  disconnected: string;
  nextSteps: string;
}

interface DataState {
  episodes: Episode[];
  goals: Goal[];
  transactions: Transaction[];
  crisisPlan: CrisisPlan;
  wins: Win[];
  retros: Retro[];
  spendingLimit: number;
  isSpendingSensitive: boolean;
  addEpisode: (episode: Omit<Episode, 'id'>) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateCrisisPlan: (plan: CrisisPlan) => void;
  addWin: (text: string, author: string) => void;
  addRetro: (retro: Omit<Retro, 'id'>) => void;
  setSpendingLimit: (limit: number) => void;
  toggleSpendingSensitivity: () => void;
}

export const useData = create<DataState>()(
  persist(
    (set) => ({
      episodes: [
        { id: '1', date: new Date(Date.now() - 86400000 * 2).toISOString(), intensity: 4, trigger: 'Work stress', notes: 'Felt overwhelmed by deadlines.', emotion: 'Anxious' },
        { id: '2', date: new Date(Date.now() - 86400000).toISOString(), intensity: 7, trigger: 'Misunderstanding', notes: 'Argument about chores escalated.', emotion: 'Angry' },
        { id: '3', date: new Date().toISOString(), intensity: 2, trigger: 'None', notes: 'Feeling calm today.', emotion: 'Neutral' },
      ],
      goals: [
        { id: '1', title: 'Save for Vacation', progress: 45, targetDate: '2024-08-01', category: 'Finance', assignedTo: 'Both' },
        { id: '2', title: 'Weekly Date Night', progress: 80, targetDate: '2024-12-31', category: 'Relationship', assignedTo: 'Both' },
        { id: '3', title: 'Meditation Habit', progress: 30, targetDate: '2024-06-01', category: 'Wellness', assignedTo: 'Me' },
      ],
      transactions: [
        { id: '1', date: '2024-05-20', description: 'Grocery Run', amount: 85.50, type: 'expense', category: 'Food', paidBy: 'Me' },
        { id: '2', date: '2024-05-18', description: 'Movie Tickets', amount: 42.00, type: 'expense', category: 'Entertainment', paidBy: 'Partner' },
        { id: '3', date: '2024-05-15', description: 'Utilities', amount: 150.00, type: 'expense', category: 'Bills', paidBy: 'Both' },
      ],
      crisisPlan: {
        triggers: ['Raised voices', 'Feeling ignored', 'Sudden plan changes'],
        deescalation: ['Give me 20 minutes of space', 'Leave a glass of water', 'Validate my feelings without arguing'],
        immediateActions: ['Deep breathing', 'Hold my hand (if I allow)', 'Call my therapist'],
        contact: 'Dr. Smith: 555-0199'
      },
      wins: [
        { id: '1', author: 'Alex', text: 'You handled that difficult call so well today. Proud of you!', date: new Date().toISOString() },
        { id: '2', author: 'Me', text: 'Thank you for making coffee this morning when I was struggling.', date: new Date().toISOString() },
      ],
      retros: [],
      spendingLimit: 200,
      isSpendingSensitive: true,
      addEpisode: (ep) => set((state) => ({ episodes: [...state.episodes, { ...ep, id: Math.random().toString() }] })),
      addGoal: (g) => set((state) => ({ goals: [...state.goals, { ...g, id: Math.random().toString() }] })),
      addTransaction: (t) => set((state) => ({ transactions: [...state.transactions, { ...t, id: Math.random().toString() }] })),
      updateCrisisPlan: (plan) => set({ crisisPlan: plan }),
      addWin: (text, author) => set((state) => ({ wins: [{ id: Math.random().toString(), text, author, date: new Date().toISOString() }, ...state.wins] })),
      addRetro: (retro) => set((state) => ({ retros: [{ ...retro, id: Math.random().toString() }, ...state.retros] })),
      setSpendingLimit: (spendingLimit) => set({ spendingLimit }),
      toggleSpendingSensitivity: () => set((state) => ({ isSpendingSensitive: !state.isSpendingSensitive })),
    }),
    {
      name: 'synccycle-data',
    }
  )
);
