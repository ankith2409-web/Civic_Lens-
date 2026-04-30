import { Category, Issue, IssueStatus } from './types';
import { subDays, subMonths } from 'date-fns';

export const VERIFICATION_THRESHOLD_PERCENT = 0.1;

export const LOCALITY_POPULATIONS: Record<string, number> = {
  'Central Business Ward': 45000,
  'Heritage Park District': 28000,
  'Indira Nagar Ward': 65000,
  'Market Yard Area': 52000,
  'Lalbagh Green Belt': 12000,
  'General / Other': 50000,
};

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'case-1',
    title: 'Crumbling Accessible Entrance',
    description: 'The primary wheelchair ramp at the main entrance is falling apart. It has been unusable for over 6 months, forcing residents with disabilities to take a significant detour.',
    category: 'RAMP',
    location: {
      lat: 12.9716,
      lng: 77.5946
    },
    address: 'Central Civic Plaza, North Wing',
    locality: 'Central Business Ward',
    civicQuote: 'A city is only as accessible as its most fragile path.',
    status: 'VERIFIED_GHOST',
    createdAt: subMonths(new Date(), 6),
    updatedAt: subDays(new Date(), 2),
    upvotes: 85,
    downvotes: 2,
    verificationScore: 160,
    reportedBy: 'UrbanAdvocate',
    reportedByUid: 'seed',
    severityScore: 8,
  },
  {
    id: 'case-2',
    title: 'Broken Drinking Water Hub',
    description: 'This public water fountain has been dry for weeks. Despite being listed as a functional amenity, there is zero pressure and the pipes appear rusted.',
    category: 'FOUNTAIN',
    location: {
      lat: 12.9750,
      lng: 77.5900
    },
    address: 'City Heritage Park, Fountain Square',
    locality: 'Heritage Park District',
    civicQuote: 'Water is the lifeblood of a community; its shared source must be preserved.',
    status: 'OPEN',
    createdAt: subDays(new Date(), 15),
    updatedAt: subDays(new Date(), 15),
    upvotes: 24,
    downvotes: 1,
    verificationScore: 24,
    reportedBy: 'CitizenK',
    reportedByUid: 'seed',
    severityScore: 6,
  },
  {
    id: 'case-3',
    title: 'Major Blackout Zone',
    description: 'Three consecutive streetlights are out on this busy stretch. It creates a major safety risk for pedestrians and cyclists returning late at night.',
    category: 'STREETLIGHT',
    location: {
      lat: 12.9680,
      lng: 77.5980
    },
    address: 'Indira Nagar 100ft Road, Metro Pillar 45',
    locality: 'Indira Nagar Ward',
    civicQuote: 'Light is the first step toward a safer street for everyone.',
    status: 'VERIFIED_GHOST',
    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 5),
    upvotes: 56,
    downvotes: 0,
    verificationScore: 112,
    reportedBy: 'Commuter_Safe',
    reportedByUid: 'seed',
    severityScore: 9,
  },
  {
    id: 'case-4',
    title: 'Sanitation Facility Shutdown',
    description: 'The public toilet facility is permanently locked with no notice. Sewage overflow is visible near the entrance, creating a major health hazard.',
    category: 'TOILET',
    location: {
      lat: 12.9640,
      lng: 77.5850
    },
    address: 'Market Yard Bus Terminus, Platform 3',
    locality: 'Market Yard Area',
    civicQuote: 'Public health starts with private dignity in public spaces.',
    status: 'OPEN',
    createdAt: subDays(new Date(), 8),
    updatedAt: subDays(new Date(), 8),
    upvotes: 19,
    downvotes: 2,
    verificationScore: 19,
    reportedBy: 'HealthFirst',
    reportedByUid: 'seed',
    severityScore: 7,
  },
  {
    id: 'case-5',
    title: 'Damaged Public Seating',
    description: 'Multiple benches in the community garden are missing planks or are completely broken. This is the only rest area for senior citizens in the ward.',
    category: 'BENCH',
    location: {
      lat: 12.9800,
      lng: 77.5920
    },
    address: 'Lalbagh West Gate Gate, Senior Circle',
    locality: 'Lalbagh Green Belt',
    civicQuote: 'A bench is not just a seat; it is a rest for the weary and a bridge for conversation.',
    status: 'OPEN',
    createdAt: subDays(new Date(), 12),
    updatedAt: subDays(new Date(), 12),
    upvotes: 31,
    downvotes: 0,
    verificationScore: 31,
    reportedBy: 'ParkLover88',
    reportedByUid: 'seed',
    severityScore: 4,
  }
];

export const CATEGORY_LABELS: Record<Category, string> = {
  RAMP: 'Accessible Ramps',
  FOUNTAIN: 'Water Fountains',
  BENCH: 'Benches',
  STREETLIGHT: 'Streetlights',
  TOILET: 'Public Toilets',
  OTHER: 'Other'
};

export const RESPONSIBLE_BODIES: Record<Category, string> = {
  RAMP: 'PWD / DPPW',
  FOUNTAIN: 'Municipal Corporation',
  BENCH: 'Parks Department',
  STREETLIGHT: 'Electricity Board',
  TOILET: 'Sanitation Department',
  OTHER: 'City Council'
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  OPEN: 'Unresolved',
  VERIFIED_GHOST: 'Verified Case',
  RESOLVED: 'Fixed'
};


