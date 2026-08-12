// vitest setup — DOM cleanup + Pinia reset
import { afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

afterEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
});