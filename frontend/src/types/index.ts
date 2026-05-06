export interface User {
  id: number;
  name: string;
  email: string;
  trust_score: number;
  credits: number;
  is_flagged: boolean;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Skill {
  id: number;
  user_id: number;
  user_name?: string;
  user_trust_score?: number;
  title: string;
  description: string;
  category: string;
  hours_required: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  sender_id: number;
  receiver_id: number;
  skill_id: number;
  skill_title?: string;
  sender_name?: string;
  receiver_name?: string;
  credits: number;
  status: 'escrow' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Session {
  id: number;
  transaction_id: number;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  status: 'active' | 'completed';
  skill_title?: string;
  other_user_name?: string;
  other_user_id?: number;
}

export interface Rating {
  id: number;
  from_user: number;
  to_user: number;
  session_id: number;
  score: number;
  feedback: string;
  created_at: string;
  from_name?: string;
}

export interface Dispute {
  id: number;
  transaction_id: number;
  raised_by: number;
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  admin_note?: string;
  created_at: string;
  raised_by_name?: string;
  skill_title?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
}

export const CATEGORIES = [
  'Programming', 'Design', 'Music', 'Language', 'Cooking',
  'Fitness', 'Writing', 'Photography', 'Marketing', 'Finance',
  'Teaching', 'Other'
];
