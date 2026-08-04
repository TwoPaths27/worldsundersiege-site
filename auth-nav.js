import { supabase } from "./supabase-config.js";
import { getSession, getProfile } from "./auth-common.js";

async function initializeAccountBar() {
  const accountBar = document.querySelector("[data-account-bar]");
  if (!accountBar) return;

  try {
    const session = await getSession();

    if (!session) {
      accountBar.innerHTML =
        '<a href="login.html">Log In</a><span>|</span><a href="register.html">Register</a>';
      return;
    }

    let username = session.user.email || "Player";
    try {
      const profile = await getProfile(session.user.id);
      username = profile.username || username;
    } catch (error) {
      console.warn("Could not load profile for navigation:", error);
    }

    accountBar.innerHTML = `
      <span class="account-name" title="${escapeHtml(session.user.email || "")}">${escapeHtml(username)}</span>
      <span>|</span>
      <button type="button" class="account-link-button" data-logout>Log Out</button>
    `;

    accountBar.querySelector("[data-logout]")?.addEventListener("click", async () => {
      const button = accountBar.querySelector("[data-logout]");
      button.disabled = true;
      button.textContent = "Logging out…";
      await supabase.auth.signOut();
      window.location.replace("login.html");
    });
  } catch (error) {
    console.error("Account navigation failed:", error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

initializeAccountBar();
