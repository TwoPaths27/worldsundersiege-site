import { getSession, getProfile } from "./auth-common.js";

const loginPage = document.documentElement.dataset.loginPage || "login.html";
const shouldRequireOnboarding = document.documentElement.dataset.requireOnboarding === "complete";

async function guardPage() {
  try {
    const session = await getSession();

    if (!session) {
      const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(`${loginPage}?next=${encodeURIComponent(next)}`);
      return;
    }

    if (shouldRequireOnboarding) {
      const profile = await getProfile(session.user.id);
      if (!profile.onboarding_complete) {
        window.location.replace("onboarding.html");
        return;
      }
    }

    document.documentElement.classList.remove("auth-checking");
  } catch (error) {
    console.error("Authentication check failed:", error);
    window.location.replace(`${loginPage}?error=auth_check`);
  }
}

guardPage();
