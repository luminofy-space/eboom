export type User = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  age?: number | null;
  phone?: string | null;
  emailVerified?: boolean | null;
  passwordHash?: string | null;
  createdAt?: string | null;
  createdBy?: number | null;
  lastModifiedAt?: string | null;
  lastModifiedBy?: number | null;
};

export type Canvas = {
  id: number;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  canvasType?: string | null;
  isArchived?: boolean | null;
  createdAt?: string | null;
  createdBy?: number | null;
  lastModifiedAt?: string | null;
  lastModifiedBy?: number | null;
};

export type Wallet = {
  id: number;
  canvasId: number;
  name: string;
  walletCategoryId: number;
  photoUrl?: string | null;
  description?: unknown;
  isArchived?: boolean | null;
  createdAt?: string | null;
  createdBy: number;
  lastModifiedAt?: string | null;
  lastModifiedBy?: number | null;
};

export type Income = {
  id: number;
  canvasId: number;
  name: string;
  currencyId: number;
  defaultWalletId?: number | null;
  amount: number;
  incomeCategoryId: number;
  isRecurring?: boolean | null;
  recurrencePattern?: unknown;
  status?: "pending" | "completed" | "failed" | "cancelled" | null;
  photoUrl?: string | null;
  description?: unknown;
  isArchived?: boolean | null;
  createdAt?: string | null;
  createdBy: number;
  lastModifiedAt?: string | null;
  lastModifiedBy?: number | null;
};
