const AUTH_KEYS = ["token", "userId", "username", "email", "role"];

function decodePayload(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Issue/expiry times from the token's own payload (no server call needed).
export function getTokenTimes(token) {
  const p = token ? decodePayload(token) : null;
  if (!p?.exp) return null;
  return { expMs: p.exp * 1000, iatMs: (p.iat ?? p.exp) * 1000 };
}

// True when a token exists but is expired or unreadable.
export function isTokenExpired(token = localStorage.getItem("token")) {
  if (!token) return false;
  const t = getTokenTimes(token);
  return !t || t.expMs <= Date.now();
}

export function clearAuth() {
  AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function loginPathFor(role) {
  if (role === "admin") return "/adminSignIn";
  if (role === "owner") return "/owner/login";
  return "/signIn";
}

// Clear the session and send the user to the login page for their role.
// The message is shown once on the next page load.
export function forceLogout(message) {
  const role = localStorage.getItem("role");
  clearAuth();
  if (message) sessionStorage.setItem("alai_logout_message", message);
  window.location.replace(loginPathFor(role));
}
