import { supabase } from "./supabase-config.js";
import {
  getSession,
  getProfile,
  destinationForProfile,
  safeNextPage,
  setMessage,
  setBusy
} from "./auth-common.js";

const page = document.body.dataset.authPage;
const message = document.querySelector("[data-auth-message]");
const params = new URLSearchParams(window.location.search);

initialize();

async function initialize() {
  try {
    const session = await getSession();

    if ((page === "login" || page === "register") && session) {
      const profile = await getProfile(session.user.id);
      window.location.replace(destinationForProfile(profile));
      return;
    }

    if (page === "login") initializeLogin();
    if (page === "register") initializeRegister();
    if (page === "forgot-password") initializeForgotPassword();
    if (page === "update-password") initializeUpdatePassword();
  } catch (error) {
    console.error(error);
    setMessage(message, "The account service could not be reached. Please try again.", "error");
  }
}

function initializeLogin() {
  if (params.get("confirmed") === "1") {
    setMessage(message, "Email confirmed. You can now log in.", "success");
  } else if (params.get("reset") === "success") {
    setMessage(message, "Password updated. You can now log in.", "success");
  }

  document.querySelector("[data-login-form]")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim();
    const password = form.password.value;

    setMessage(message, "");
    setBusy(submit, true, "Logging in…");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const profile = await getProfile(data.user.id);
      const next = safeNextPage(params.get("next"));
      window.location.replace(destinationForProfile(profile, next));
    } catch (error) {
      setMessage(message, readableAuthError(error), "error");
      setBusy(submit, false);
    }
  });
}

function initializeRegister() {
  document.querySelector("[data-register-form]")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    setMessage(message, "");

    if (!/^[A-Za-z0-9_-]{3,24}$/.test(username)) {
      setMessage(
        message,
        "Username must be 3–24 characters and use only letters, numbers, underscores, or hyphens.",
        "error"
      );
      return;
    }

    if (password.length < 8) {
      setMessage(message, "Password must be at least 8 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(message, "The passwords do not match.", "error");
      return;
    }

    setBusy(submit, true, "Creating account…");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/login.html?confirmed=1`
        }
      });

      if (error) throw error;

      form.reset();
      setMessage(
        message,
        `Account created. Check ${email} for the confirmation link, then return here to log in.`,
        "success"
      );

      if (data.session) {
        window.location.replace("onboarding.html");
      } else {
        setBusy(submit, false);
      }
    } catch (error) {
      setMessage(message, readableAuthError(error), "error");
      setBusy(submit, false);
    }
  });
}

function initializeForgotPassword() {
  document.querySelector("[data-forgot-form]")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim();

    setMessage(message, "");
    setBusy(submit, true, "Sending link…");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password.html`
      });
      if (error) throw error;

      form.reset();
      setMessage(
        message,
        "If an account uses that email address, a password-reset link has been sent.",
        "success"
      );
    } catch (error) {
      setMessage(message, readableAuthError(error), "error");
    } finally {
      setBusy(submit, false);
    }
  });
}

function initializeUpdatePassword() {
  let recoveryReady = false;

  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" || session) {
      recoveryReady = true;
      document.querySelector("[data-update-password-form]")?.removeAttribute("aria-disabled");
    }
  });

  document.querySelector("[data-update-password-form]")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    setMessage(message, "");

    if (!recoveryReady) {
      setMessage(message, "Open this page using the password-reset link from your email.", "error");
      return;
    }

    if (password.length < 8) {
      setMessage(message, "Password must be at least 8 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(message, "The passwords do not match.", "error");
      return;
    }

    setBusy(submit, true, "Updating password…");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      window.location.replace("login.html?reset=success");
    } catch (error) {
      setMessage(message, readableAuthError(error), "error");
      setBusy(submit, false);
    }
  });

  window.addEventListener("pagehide", () => {
    authListener.subscription.unsubscribe();
  });
}

function readableAuthError(error) {
  const raw = String(error?.message || error || "");
  const lower = raw.toLowerCase();

  if (lower.includes("invalid login credentials")) return "Incorrect email or password.";
  if (lower.includes("email not confirmed")) return "Confirm your email before logging in.";
  if (lower.includes("user already registered")) return "An account already uses this email.";
  if (lower.includes("database error saving new user")) {
    return "That username may already be taken. Choose another username and try again.";
  }
  if (lower.includes("password")) return raw;
  if (lower.includes("rate limit")) return "Too many attempts. Wait a moment and try again.";

  return raw || "Something went wrong. Please try again.";
}
