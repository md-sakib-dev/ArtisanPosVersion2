/*
 * AUTO UPDATE — long-lived tabs pick up new deployments without Ctrl + F5.
 *
 * Vite fingerprints every JS/CSS asset, so a fresh page load always gets the
 * new code. The remaining problem is a tab that is already open: it keeps
 * running the bundle it was loaded with until somebody hard-refreshes.
 *
 * To close that gap `vite.config.ts` stamps each build with a unique id
 * (`__APP_BUILD_ID__`) and emits `version.json` next to index.html. This
 * module polls that file — always with `cache: "no-store"` — and, as soon as
 * the deployed id differs from the id this bundle was built with, reloads the
 * tab. The reload is done through a cache-busting URL, so the browser is
 * forced to fetch a fresh index.html (and therefore the fresh bundle) even if
 * the old document was cached.
 */

/** Build id of the running bundle — injected by vite.config.ts (`define`). */
const CURRENT_BUILD_ID = __APP_BUILD_ID__;

/** Query param used once per update to bypass a cached index.html. */
const CACHE_BUST_PARAM = "v";

/** Deployed-build descriptor emitted by the build. */
const VERSION_URL = `${import.meta.env.BASE_URL}version.json`;

/** How often to look for a new deployment while the tab stays open. */
const POLL_INTERVAL_MS = 60_000;

/** How long to wait before retrying a reload that was deferred. */
const BUSY_RETRY_MS = 5_000;

/**
 * sessionStorage key holding the deployed id we already reloaded for.
 * Stops an endless reload loop if a cache ever serves a `version.json` that
 * is newer than the index.html it is paired with.
 */
const RELOAD_GUARD_KEY = "app-update:reloaded-for";

interface VersionFile {
  buildId?: string;
}

let checking = false;
let retryTimer: number | null = null;
let reloading = false;

function readGuard(): string | null {
  try {
    return sessionStorage.getItem(RELOAD_GUARD_KEY);
  } catch {
    /* storage blocked (private mode) — polling still works */
    return null;
  }
}

function writeGuard(buildId: string): void {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, buildId);
  } catch {
    /* ignore */
  }
}

function clearGuard(): void {
  try {
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Modals in this app are native `<dialog>` elements, so an open one means a
 * cashier is mid-transaction. Never reload underneath that.
 */
const hasOpenModal = (): boolean => document.querySelector("dialog[open]") !== null;

/** Deployed build id, or null when it can't be read (offline, dev, old deploy). */
async function fetchDeployedBuildId(): Promise<string | null> {
  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as VersionFile;
    return typeof data.buildId === "string" && data.buildId ? data.buildId : null;
  } catch {
    /* no version.json yet / not JSON / offline — nothing to do */
    return null;
  }
}

/** Reload on a fresh URL so a cached index.html cannot be reused. */
function reloadWithCacheBust(deployedBuildId: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(CACHE_BUST_PARAM, deployedBuildId);
  window.location.replace(url.toString());
}

async function checkForUpdate(): Promise<void> {
  if (checking || reloading) return;
  checking = true;

  try {
    const deployedBuildId = await fetchDeployedBuildId();
    if (!deployedBuildId || deployedBuildId === CURRENT_BUILD_ID) return;

    /* Already reloaded for this deployment and still on the old bundle:
       the served document is stale, so stop instead of looping. */
    if (readGuard() === deployedBuildId) return;

    if (hasOpenModal()) {
      if (retryTimer === null) {
        retryTimer = window.setTimeout(() => {
          retryTimer = null;
          void checkForUpdate();
        }, BUSY_RETRY_MS);
      }
      return;
    }

    reloading = true;
    writeGuard(deployedBuildId);
    reloadWithCacheBust(deployedBuildId);
  } finally {
    checking = false;
  }
}

/**
 * Drops our own `?v=` marker so the address bar (and anything a cashier
 * copies out of it) stays on the canonical URL. The marker is recognised by
 * matching either the running build or the deployment we reloaded for.
 */
function stripCacheBustParam(): void {
  try {
    const url = new URL(window.location.href);
    const marker = url.searchParams.get(CACHE_BUST_PARAM);
    if (marker !== CURRENT_BUILD_ID && marker !== readGuard()) return;

    url.searchParams.delete(CACHE_BUST_PARAM);
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    /* ignore — a stray query param is harmless */
  }
}

/**
 * Starts watching for new deployments. Safe to call once on boot; does
 * nothing in development, where Vite already serves the latest code.
 */
export function startAppUpdateChecker(): void {
  if (import.meta.env.DEV) return;

  /* Debug aid: shows which build a tab is running (DevTools / support). */
  document.documentElement.dataset.appBuild = CURRENT_BUILD_ID;

  stripCacheBustParam();

  /* A reload that worked landed us on the new bundle — reset the guard. */
  if (readGuard() === CURRENT_BUILD_ID) clearGuard();

  void checkForUpdate();
  window.setInterval(() => void checkForUpdate(), POLL_INTERVAL_MS);

  /* POS tabs stay open for days, so also check whenever the tab is brought
     back to the foreground. */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkForUpdate();
  });
  window.addEventListener("focus", () => void checkForUpdate());
}
