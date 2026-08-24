export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthenticatedUser;
};

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string };
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user?: SupabaseUser;
};

const SESSION_KEY = "acc-ordo-auth-v1";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isAuthConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

function displayName(user: SupabaseUser) {
  return (
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Responsável técnico"
  );
}

function toSession(payload: AuthResponse): StoredSession {
  if (!payload.access_token || !payload.refresh_token || !payload.user) {
    throw new Error("A resposta de autenticação não contém uma sessão válida.");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt:
      payload.expires_at ??
      Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600),
    user: {
      id: payload.user.id,
      email: payload.user.email ?? "",
      name: displayName(payload.user),
    },
  };
}

function storeSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function readSession() {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as StoredSession) : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
) {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("A autenticação ainda não foi configurada.");
  }

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: supabasePublishableKey,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    msg?: string;
    message?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error_description ??
        payload.message ??
        payload.msg ??
        "Não foi possível concluir a autenticação.",
    );
  }
  return payload;
}

async function fetchUser(accessToken: string) {
  return request<{ user: SupabaseUser }>("/auth/v1/user", {}, accessToken);
}

async function refreshSession(refreshToken: string) {
  const payload = await request<AuthResponse>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return storeSession(toSession(payload));
}

async function sessionFromConfirmationHash() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (!accessToken || !refreshToken) return null;

  const { user } = await fetchUser(accessToken);
  const expiresIn = Number(hash.get("expires_in") ?? "3600");
  window.history.replaceState(
    {},
    document.title,
    `${window.location.pathname}${window.location.search}`,
  );
  return storeSession({
    accessToken,
    refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
    user: {
      id: user.id,
      email: user.email ?? "",
      name: displayName(user),
    },
  });
}

export async function restoreAuthSession() {
  if (!isAuthConfigured) return null;

  try {
    const confirmedSession = await sessionFromConfirmationHash();
    if (confirmedSession) return confirmedSession;

    const session = readSession();
    if (!session) return null;
    if (session.expiresAt - Math.floor(Date.now() / 1000) > 60) return session;
    return await refreshSession(session.refreshToken);
  } catch {
    clearSession();
    return null;
  }
}

export async function signIn(email: string, password: string) {
  const payload = await request<AuthResponse>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return storeSession(toSession(payload));
}

export async function signUp(name: string, email: string, password: string) {
  const payload = await request<AuthResponse>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: { full_name: name.trim() },
      email_redirect_to: window.location.href.split("#")[0],
    }),
  });

  if (!payload.access_token || !payload.refresh_token || !payload.user) {
    return null;
  }
  return storeSession(toSession(payload));
}

export async function signOut() {
  const session = readSession();
  try {
    if (session) {
      await request("/auth/v1/logout", { method: "POST" }, session.accessToken);
    }
  } finally {
    clearSession();
  }
}
