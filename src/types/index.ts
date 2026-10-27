export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface WorldMember {
  id: string;
  worldId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER' | string;
  joinedAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface World {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  ownerId: string;
  owner?: {
    id: string;
    name?: string | null;
    email: string;
  };
  members?: WorldMember[];
  _count?: {
    markers: number;
    members: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Marker {
  id: string;
  worldId: string;
  createdById: string;
  createdBy?: {
    id: string;
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  title: string;
  description?: string | null;
  lat: number;
  lng: number;
  imageUrl?: string | null;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MapStyle = 'satellite' | 'dark' | 'street';

export interface PendingLocation {
  lat: number;
  lng: number;
}
