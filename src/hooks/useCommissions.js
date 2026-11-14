import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export function useCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("commissions")
      .select("id, amount, status, created_at")
      .order("created_at", { ascending: false });
    if (queryError || !Array.isArray(data)) {
      setError("Data komisi belum bisa dimuat. Coba lagi beberapa saat.");
    } else {
      setError("");
      setCommissions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { commissions, loading, error, reload: load };
}
