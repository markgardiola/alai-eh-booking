import axios from "axios";
import { toast } from "react-toastify";
import { clearAuth, forceLogout, getTokenTimes, isTokenExpired } from "./auth";

const SESSION_FLAG = "alai_session_alive";
const MESSAGE_KEY = "alai_logout_message";
const EXPIRED_MSG = "Your session has expired. Please sign in again.";
const AUTH_ERROR_CODES = new Set([
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "NO_TOKEN",
]);

// --- 1. Browser closed => logged out on next visit -----------------------
// sessionStorage is wiped when the browser closes, localStorage is not.
// A tab without the flag is either a brand-new tab or a reopened browser,
// so it asks the other tabs (BroadcastChannel) whether a session is alive.
// Nobody answers => the browser was closed => clear the login.
function checkBrowserSession() {
  return new Promise((resolve) => {
    const finish = () => {
      sessionStorage.setItem(SESSION_FLAG, "1");
      resolve();
    };

    if (typeof BroadcastChannel === "undefined") return finish();

    const channel = new BroadcastChannel("alai-auth");
    channel.onmessage = (e) => {
      if (e.data === "ping" && sessionStorage.getItem(SESSION_FLAG)) {
        channel.postMessage("pong");
      }
    };

    if (
      !localStorage.getItem("token") ||
      sessionStorage.getItem(SESSION_FLAG)
    ) {
      return finish();
    }

    let alive = false;
    channel.addEventListener("message", (e) => {
      if (e.data === "pong") alive = true;
    });
    channel.postMessage("ping");

    setTimeout(() => {
      if (!alive) clearAuth();
      finish();
    }, 250);
  });
}

// --- 2. Server says the token is bad => log out ---------------------------
function installAxiosGuard() {
  axios.interceptors.response.use(
    (res) => res,
    (error) => {
      const code = error.response?.data?.code;
      if (
        error.response?.status === 401 &&
        AUTH_ERROR_CODES.has(code) &&
        localStorage.getItem("token")
      ) {
        forceLogout(
          code === "TOKEN_EXPIRED" ? EXPIRED_MSG : "Please sign in again.",
        );
      }
      return Promise.reject(error);
    },
  );
}

// --- 3. Watch the clock: warn shortly before expiry, log out at expiry ----
function startExpiryWatcher() {
  let warned = false;

  const tick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      warned = false;
      return;
    }

    const t = getTokenTimes(token);
    if (!t || t.expMs <= Date.now()) {
      forceLogout(EXPIRED_MSG);
      return;
    }

    const remaining = t.expMs - Date.now();
    const warnAt = Math.min(5 * 60 * 1000, (t.expMs - t.iatMs) * 0.25);
    if (!warned && remaining <= warnAt) {
      warned = true;
      const mins = Math.max(1, Math.ceil(remaining / 60000));
      toast.warning(
        `Your session expires in about ${mins} minute${mins > 1 ? "s" : ""}. Finish what you're doing -- you'll need to sign in again.`,
        { autoClose: 10000 },
      );
    }
  };

  setInterval(tick, 15000);
  // Timers get throttled in background tabs and asleep laptops, so also
  // re-check the moment the user comes back.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
  window.addEventListener("focus", tick);

  // Logged out in another tab => this tab follows.
  window.addEventListener("storage", (e) => {
    if (e.key === "token" && e.newValue === null) window.location.reload();
  });
}

function showPendingMessage() {
  const msg = sessionStorage.getItem(MESSAGE_KEY);
  if (!msg) return;
  sessionStorage.removeItem(MESSAGE_KEY);
  setTimeout(() => toast.info(msg), 400);
}

export async function setupAuthGuard() {
  await checkBrowserSession();

  if (isTokenExpired()) {
    clearAuth();
    sessionStorage.setItem(MESSAGE_KEY, EXPIRED_MSG);
  }

  installAxiosGuard();
  startExpiryWatcher();
  showPendingMessage();
}
