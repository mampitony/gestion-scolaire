import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Profil } from "./types";

interface Ctx {
  user: User | null;
  profil: Profil | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

const INACTIVITE_MS = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          const s = await getDoc(doc(db, "utilisateurs", u.uid));
          setProfil(s.exists() ? (s.data() as Profil) : null);
        } else {
          setProfil(null);
        }
        setLoading(false);
      }),
    []
  );

  // Déconnexion automatique après inactivité
  useEffect(() => {
    if (!user) return;
    let t = setTimeout(() => signOut(auth), INACTIVITE_MS);
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(() => signOut(auth), INACTIVITE_MS);
    };
    const events = ["click", "keydown", "mousemove"];
    events.forEach((e) => window.addEventListener(e, reset));
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, profil, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
