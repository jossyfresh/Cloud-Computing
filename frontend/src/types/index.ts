export interface ModerationResult {
  flagged: boolean;
  reason: string | null;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  categories?: Record<string, boolean>;
  categoryScores?: Record<string, number>;
}

export interface Post {
  id: string;
  text: string;
  author?: string;
  createdAt: string;
  moderationResult: ModerationResult;
}
