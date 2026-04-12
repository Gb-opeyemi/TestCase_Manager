const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attemptStore = new Map();

function getClientKey(req, identity = "") {
  // This builds one key from the ip and identity text.
  const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
  return `${ipAddress}:${identity}`;
}

function getAttemptState(key) {
  // This reads the current rate limit state.
  const now = Date.now();
  const savedState = attemptStore.get(key);

  if (!savedState || savedState.expiresAt <= now) {
    const nextState = {
      attempts: 0,
      expiresAt: now + WINDOW_MS,
    };
    attemptStore.set(key, nextState);
    return nextState;
  }

  return savedState;
}

function isRateLimited(key) {
  // This checks if the key is blocked right now.
  const state = getAttemptState(key);
  return state.attempts >= MAX_ATTEMPTS;
}

function recordFailedAttempt(key) {
  // This adds one failed login attempt.
  const state = getAttemptState(key);
  state.attempts += 1;
  attemptStore.set(key, state);
  return state;
}

function clearFailedAttempts(key) {
  // This clears the saved failures after a good login.
  attemptStore.delete(key);
}

module.exports = {
  MAX_ATTEMPTS,
  WINDOW_MS,
  clearFailedAttempts,
  getClientKey,
  isRateLimited,
  recordFailedAttempt,
};
