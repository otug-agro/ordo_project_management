import { FormEvent, useEffect, useState } from "react";
import Home from "./App";
import {
  AuthenticatedUser,
  isAuthConfigured,
  restoreAuthSession,
  signIn,
  signOut,
  signUp,
} from "./auth";

type AuthMode = "sign-in" | "sign-up";
type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "acc-ordo-theme-v1";

function initialTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // A preferência do sistema permanece disponível se o armazenamento falhar.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AuthGate() {
  const [session, setSession] = useState<AuthenticatedUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // O tema ainda é aplicado nesta sessão quando o armazenamento falha.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  useEffect(() => {
    void restoreAuthSession().then((savedSession) => {
      setSession(savedSession?.user ?? null);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (mode === "sign-up" && !name.trim()) {
      setMessage("Informe seu nome para identificar o responsável técnico.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use uma senha com pelo menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        const nextSession = await signIn(email.trim(), password);
        setSession(nextSession.user);
      } else {
        const nextSession = await signUp(name, email.trim(), password);
        if (nextSession) {
          setSession(nextSession.user);
        } else {
          setMessage(
            "Cadastro criado. Confira seu e-mail, confirme a conta e depois entre.",
          );
          setMode("sign-in");
        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível continuar.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
    setPassword("");
  }

  if (checking) {
    return <main className="auth-page"><p className="auth-loading">Verificando acesso…</p></main>;
  }

  if (session) {
    return (
      <Home
        key={session.id}
        currentUser={session}
        onSignOut={() => void handleSignOut()}
        userInitials={initials(session.name)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <main className="auth-page">
      <button
        className="theme-toggle auth-theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      >
        <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
      </button>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand" aria-label="ACC Ordo Project Manager">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <strong>ACC Ordo</strong>
          <span>Project Manager</span>
        </div>
        {!isAuthConfigured ? (
          <div className="auth-setup">
            <p className="workspace-kicker">CONFIGURAÇÃO PENDENTE</p>
            <h1 id="auth-title">O acesso ainda não foi configurado.</h1>
            <p>Defina as variáveis públicas do Supabase indicadas no README e publique novamente o site.</p>
          </div>
        ) : (
          <>
            <p className="workspace-kicker">ACESSO AO PLANEJAMENTO</p>
            <h1 id="auth-title">{mode === "sign-in" ? "Entre na sua conta" : "Crie sua conta"}</h1>
            <p className="auth-description">Acesse com e-mail e senha. Não usamos autenticação da Microsoft.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "sign-up" && (
                <label>
                  <span>Nome do responsável técnico</span>
                  <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
              )}
              <label>
                <span>E-mail</span>
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                <span>Senha</span>
                <input type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
              </label>
              {message && <p className="auth-message" role="status">{message}</p>}
              <button className="primary-button auth-submit" type="submit" disabled={submitting}>
                {submitting ? "Aguarde…" : mode === "sign-in" ? "Entrar" : "Criar conta"}
              </button>
            </form>
            <p className="auth-switch">
              {mode === "sign-in" ? "Ainda não tem conta?" : "Já possui uma conta?"}{" "}
              <button type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>
                {mode === "sign-in" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
 
