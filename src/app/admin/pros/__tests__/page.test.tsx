// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const gate = vi.hoisted(() => ({ ready: true, error: null as string | null, api: vi.fn() }));
vi.mock("@/components/admin/use-admin-gate", () => ({ useAdminGate: () => ({ ...gate, adminName: "Admin", adminRole: "super_admin" }) }));
vi.mock("@/components/admin/admin-shell", () => ({ AdminShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/admin/admin-guide-banner", () => ({ AdminGuideBanner: () => null }));
import Page from "../page";

beforeEach(() => { gate.ready = true; gate.error = null; gate.api.mockReset(); });
afterEach(cleanup);

it("waits for auth, then requests pros and renders dual-role rows and optional-field fallbacks", async () => {
  gate.ready = false;
  gate.api.mockResolvedValue({ ok: true, data: { users: [{ id: "dual", role: "motorist", full_name: "Ada", is_active: true, repair_pro_profiles: { primary_service: "mechanic", status: "approved", verified: true } }, { id: "missing", is_active: false }] } });
  const view = render(<Page />);
  expect(gate.api).not.toHaveBeenCalled();
  expect(screen.getByRole("status").textContent).toBe("Loading pros…");
  gate.ready = true;
  view.rerender(<Page />);
  expect(await screen.findByText("Ada")).toBeTruthy();
  expect(screen.getByText("mechanic")).toBeTruthy();
  expect(screen.getByText("Unnamed pro")).toBeTruthy();
  expect(screen.getByText("Inactive")).toBeTruthy();
  expect(gate.api).toHaveBeenCalledWith("/api/admin/users?role=repair_pro", { cache: "no-store" });
  expect(gate.api).toHaveBeenCalledTimes(1);
});

it("shows failures rather than an empty list and recovers through manual refresh", async () => {
  gate.api.mockResolvedValueOnce({ ok: false, message: "Database unavailable" }).mockResolvedValueOnce({ ok: true, data: { users: [] } });
  render(<Page />);
  expect((await screen.findByRole("alert")).textContent).toBe("Database unavailable");
  expect(screen.queryByText("No pros found.")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  expect(await screen.findByText("No pros found.")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(gate.api).toHaveBeenCalledTimes(2);
});

it("keeps loading visible until the list request resolves", async () => {
  let resolve!: (value: unknown) => void;
  gate.api.mockReturnValue(new Promise((done) => { resolve = done; }));
  render(<Page />);
  expect(screen.getByRole("status")).toBeTruthy();
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  resolve({ ok: true, data: { users: [] } });
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
});

it("displays auth network failure without requesting data", () => {
  gate.ready = false; gate.error = "Network error";
  render(<Page />);
  expect(screen.getByRole("alert").textContent).toBe("Network error");
  expect(gate.api).not.toHaveBeenCalled();
});
