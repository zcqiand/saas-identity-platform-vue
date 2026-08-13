// MSW browser worker setup for Vue dev mode.
import { setupBrowserMocks } from "@saas/identity-platform-msw/browser";

export async function enableMocking() {
  if (!import.meta.env.DEV) return;
  await setupBrowserMocks();
}
