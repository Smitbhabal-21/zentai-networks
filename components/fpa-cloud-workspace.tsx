"use client";

import { useEffect, useState } from "react";
import { CloudUpload, Download, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase-client";
import { validImport, type FpaModel } from "@/lib/fpa";

type Saved = { id: string; label: string; created_at: string };
const client = getSupabaseClient();

export function FpaCloudWorkspace({ model, onLoad }: { model: FpaModel; onLoad: (model: FpaModel) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!client) return;
    void client.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!client || !user) { setSaved([]); return; }
    void client.from("fpa_snapshots").select("id,label,created_at").order("created_at", { ascending: false }).limit(12).then(({ data, error }) => {
      if (error) setMessage(`Cloud list unavailable: ${error.message}`);
      else setSaved((data || []) as Saved[]);
    });
  }, [user]);
  if (!client) return <details className="panel fpa-cloud"><summary><CloudUpload size={16} /> Secure cloud workspaces <span>Supabase setup pending</span></summary><p className="note">Cloud saving will be available after a Supabase project is connected. Until then, your model stays in this browser; export JSON for a separate backup. Do not import confidential company data on a shared device.</p></details>;
  const signIn = async () => {
    if (!email.trim()) return;
    setBusy(true); setMessage("");
    const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Check your email for the sign-in link. This browser will connect after you open it.");
    setBusy(false);
  };
  const refresh = async () => {
    const { data, error } = await client.from("fpa_snapshots").select("id,label,created_at").order("created_at", { ascending: false }).limit(12);
    if (error) setMessage(error.message);
    else setSaved((data || []) as Saved[]);
  };
  const save = async () => {
    if (!user || !validImport(model)) return;
    setBusy(true); setMessage("");
    const name = (label.trim() || `FP&A ${new Date().toISOString().slice(0, 10)}`).slice(0, 80);
    const { error } = await client.from("fpa_snapshots").insert({ user_id: user.id, label: name, model });
    if (error) setMessage(`Save failed: ${error.message}`);
    else { setMessage(`Saved ${name} to your private workspace.`); setLabel(""); await refresh(); }
    setBusy(false);
  };
  const load = async (item: Saved) => {
    setBusy(true); setMessage("");
    const { data, error } = await client.from("fpa_snapshots").select("model").eq("id", item.id).single();
    if (error) setMessage(`Load failed: ${error.message}`);
    else if (!validImport(data?.model)) setMessage("The saved model failed validation. Nothing was loaded.");
    else { onLoad(data.model); setMessage(`Loaded ${item.label}. It is now saved in this browser too.`); }
    setBusy(false);
  };
  return <details className="panel fpa-cloud"><summary><CloudUpload size={16} /> Secure cloud workspaces <span>{user ? user.email : "Sign in to save across devices"}</span></summary><div className="fpa-cloud-body"><p className="note">Cloud snapshots are private to the signed-in user through Supabase row-level security. Saving is manual and append-only; loading a snapshot replaces the browser model.</p>
    {!user ? <div className="fpa-cloud-auth"><input type="email" aria-label="Email for secure workspace" placeholder="Your email" value={email} onChange={event => setEmail(event.target.value)} /><button className="button primary" disabled={busy || !email.trim()} onClick={() => void signIn()}>Email sign-in link</button></div> : <><div className="fpa-cloud-actions"><input aria-label="Snapshot name" placeholder="Snapshot name (optional)" maxLength={80} value={label} onChange={event => setLabel(event.target.value)} /><button className="button primary" disabled={busy} onClick={() => void save()}><CloudUpload size={15} /> Save private snapshot</button><button className="button" disabled={busy} onClick={() => void client.auth.signOut()}><LogOut size={15} /> Sign out</button></div><div className="fpa-cloud-saved"><h4>Saved snapshots</h4>{saved.length ? saved.map(item => <div key={item.id}><div><strong>{item.label}</strong><small>{new Date(item.created_at).toLocaleString()}</small></div><button className="button" disabled={busy} onClick={() => void load(item)}><Download size={14} /> Load</button></div>) : <p className="note">No cloud snapshot saved yet.</p>}</div></>}
    {message && <p className="notice" role="status">{message}</p>}
  </div></details>;
}
