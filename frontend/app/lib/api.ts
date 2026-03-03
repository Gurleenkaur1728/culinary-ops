const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiFetchRaw(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name?: string) =>
    apiFetch<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  me: () => apiFetch<User>('/auth/me'),

  // Ingredients
  getIngredients: (params?: { search?: string; skip?: number; take?: number }) =>
    apiFetch<PaginatedResponse<Ingredient>>(
      `/ingredients?${new URLSearchParams(cleanParams(params))}`,
    ),
  createIngredient: (data: { id: string; name: string }) =>
    apiFetch<Ingredient>('/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  updateIngredient: (id: string, data: { name?: string }) =>
    apiFetch<Ingredient>(`/ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIngredient: (id: string) =>
    apiFetch<{ success: boolean }>(`/ingredients/${id}`, { method: 'DELETE' }),

  // Sub-Recipes
  getSubRecipes: (params?: { search?: string; station?: string; day?: string; priority?: string; skip?: number; take?: number }) =>
    apiFetch<PaginatedResponse<SubRecipe>>(
      `/sub-recipes?${new URLSearchParams(cleanParams(params))}`,
    ),
  getSubRecipe: (id: string) => apiFetch<SubRecipe>(`/sub-recipes/${id}`),
  createSubRecipe: (data: Partial<SubRecipe> & { ingredients?: SRIngredientInput[] }) =>
    apiFetch<SubRecipe>('/sub-recipes', { method: 'POST', body: JSON.stringify(data) }),
  updateSubRecipe: (id: string, data: any) =>
    apiFetch<SubRecipe>(`/sub-recipes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSubRecipe: (id: string) =>
    apiFetch<{ success: boolean }>(`/sub-recipes/${id}`, { method: 'DELETE' }),

  // Meals
  getMeals: (params?: { search?: string; category?: string; skip?: number; take?: number }) =>
    apiFetch<PaginatedResponse<Meal>>(
      `/meals?${new URLSearchParams(cleanParams(params))}`,
    ),
  getMeal: (id: string) => apiFetch<Meal>(`/meals/${id}`),
  getMealCategories: () => apiFetch<string[]>('/meals/categories'),
  createMeal: (data: any) =>
    apiFetch<Meal>('/meals', { method: 'POST', body: JSON.stringify(data) }),
  updateMeal: (id: string, data: any) =>
    apiFetch<Meal>(`/meals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMeal: (id: string) =>
    apiFetch<{ success: boolean }>(`/meals/${id}`, { method: 'DELETE' }),

  // Production Plans
  getPlans: () => apiFetch<ProductionPlan[]>('/production-plans'),
  getPlan: (id: string) => apiFetch<PlanWithItems>(`/production-plans/${id}`),
  createPlan: (data: { name: string; weekLabel?: string; productionDate?: string; status?: string; notes?: string }) =>
    apiFetch<PlanWithItems>('/production-plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: string, data: any) =>
    apiFetch<PlanWithItems>(`/production-plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePlan: (id: string) =>
    apiFetch<{ success: boolean }>(`/production-plans/${id}`, { method: 'DELETE' }),
  duplicatePlan: (id: string) =>
    apiFetch<PlanWithItems>(`/production-plans/${id}/duplicate`, { method: 'POST' }),
  upsertPlanItem: (planId: string, mealId: string, quantity: number) =>
    apiFetch(`/production-plans/${planId}/items`, {
      method: 'POST',
      body: JSON.stringify({ mealId, quantity }),
    }),
  removePlanItem: (planId: string, mealId: string) =>
    apiFetch(`/production-plans/${planId}/items/${mealId}`, { method: 'DELETE' }),

  // Reports
  getCookingReport: (planId: string) =>
    apiFetch<CookingReportStation[]>(`/reports/cooking?planId=${planId}`),
  getSubRecipeReport: (planId: string) =>
    apiFetch<CookingReportStation[]>(`/reports/sub-recipes?planId=${planId}`),
  getShoppingList: (planId: string) =>
    apiFetch<ShoppingListItem[]>(`/reports/shopping-list?planId=${planId}`),
  exportCookingCsv: (planId: string) =>
    apiFetchRaw(`/reports/cooking/export-csv?planId=${planId}`),
  exportShoppingListCsv: (planId: string) =>
    apiFetchRaw(`/reports/shopping-list/export-csv?planId=${planId}`),

  // Import
  importSubRecipes: (file: File) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/import/sub-recipes`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then((r) => r.json() as Promise<ImportResult>);
  },
  importMeals: (file: File) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/import/meals`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then((r) => r.json() as Promise<ImportResult>);
  },
};

function cleanParams(params?: Record<string, any>): Record<string, string> {
  if (!params) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = String(v);
  }
  return out;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Ingredient {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SRIngredientInput {
  ingredientId: string;
  weight?: number;
  unit?: string;
  trimPct?: number;
}

export interface SRIngredient {
  id: string;
  subRecipeId: string;
  ingredientId: string;
  weight: number | null;
  unit: string | null;
  trimPct: number | null;
  ingredient: { id: string; name: string };
}

export interface SubRecipe {
  id: string;
  name: string;
  station: string | null;
  day: string | null;
  priority: number | null;
  prepInstructions: string | null;
  backendUrl: string | null;
  baseWeight: number | null;
  baseUnit: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: SRIngredient[];
}

export interface MealSubRecipe {
  id: string;
  mealId: string;
  subRecipeId: string;
  srName: string | null;
  perPortion: number | null;
  unit: string | null;
  subRecipe: SubRecipe;
}

export interface Meal {
  id: string;
  name: string;
  category: string | null;
  price: string | null;
  backendUrl: string | null;
  createdAt: string;
  updatedAt: string;
  subRecipes: MealSubRecipe[];
  _count: { subRecipes: number };
}

export interface ProductionPlan {
  id: string;
  name: string;
  weekLabel: string | null;
  productionDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface PlanItem {
  id: string;
  planId: string;
  mealId: string;
  quantity: number;
  meal: { id: string; name: string; category: string | null; price: string | null };
}

export interface PlanWithItems extends ProductionPlan {
  items: PlanItem[];
}

export interface CookingReportIngredient {
  ingredientId: string;
  ingredientName: string;
  perPortion: number | null;
  unit: string | null;
  trimPct: number | null;
  totalBatch: number;
  totalKgs: number | null;
}

export interface CookingReportSR {
  srId: string;
  srName: string;
  priority: number;
  prepInstructions: string;
  totalPortions: number;
  ingredients: CookingReportIngredient[];
}

export interface CookingReportStation {
  station: string;
  subRecipes: CookingReportSR[];
}

export interface ShoppingListItem {
  ingredientId: string;
  ingredientName: string;
  totalQty: number;
  unit: string;
  totalKgs: number | null;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
