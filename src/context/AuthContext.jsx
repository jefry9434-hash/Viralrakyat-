import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .maybeSingle();
  return error ? null : data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      (async () => {
        setSession(nextSession);
        if (!nextSession) {
          setProfile(null);
          setLoading(false);
          return;
        }
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") setLoading(true);
        setProfile(await fetchProfile(nextSession.user.id));
        setLoading(false);
      })();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
