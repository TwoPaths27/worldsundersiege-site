import { supabase } from "./supabase-config.js";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, onboarding_step, onboarding_complete")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export function destinationForProfile(profile, fallback = "index.html") {
  return profile?.onboarding_complete ? fallback : "onboarding.html";
}

export function safeNextPage(value) {
  if (!value) return "index.html";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "index.html";
    const relative = `${url.pathname.replace(/^\//, "")}${url.search}${url.hash}`;
    if (!relative || relative.startsWith("login.html") || relative.startsWith("register.html")) {
      return "index.html";
    }
    return relative;
  } catch {
    return "index.html";
  }
}

export function setMessage(element, message, type = "info") {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.dataset.type = type;
}

export function setBusy(button, busy, busyText = "Please wait…") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}
