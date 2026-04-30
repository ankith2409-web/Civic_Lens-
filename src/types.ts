export type UserRole = 'REPORTER' | 'VERIFIER' | 'GOVERNMENT';
export type IssueStatus = 'OPEN' | 'VERIFIED_GHOST' | 'RESOLVED';
export type Category = 'RAMP' | 'FOUNTAIN' | 'BENCH' | 'STREETLIGHT' | 'TOILET' | 'OTHER';

export interface User {
  uid: string;          // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  score?: number; // Community verification score
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  location: Location;
  address: string;
  status: IssueStatus;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number; // "Yes it's broken" / Verification raw count
  downvotes: number; // "Fixed / Not Valid" raw count
  verificationScore: number; // Weighted score based on user roles
  reportedBy: string;
  reportedByUid: string; // Firebase Auth UID of the reporter
  locality: string; // Ward or area name
  civicQuote?: string; // AI generated civic sense quote
  mlConfidenceScore?: number; // Placeholder for ML integration
  severityScore?: number; // AI estimated priority level (1-10)
  officialResponse?: string; // Government reply or statement
  workLogUrl?: string; // Link to public work ticket
  votes?: Record<string, 'UP' | 'DOWN'>; // Track which users voted which way
  resolvedAt?: Date; // When the issue was marked resolved
}
