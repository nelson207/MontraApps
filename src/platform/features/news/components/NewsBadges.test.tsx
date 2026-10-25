// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { statusOf, toNewsItem } from "../newsModel";
import { NewsStatusBadge } from "./NewsBadges";

afterEach(cleanup);

const now = new Date("2026-10-22T12:00:00Z");
const statusFor = (validityBeginDate: string | null, validityEndDate: string | null) =>
  toNewsItem({ id: "news-1", title: "x", validityBeginDate, validityEndDate }, new Map(), now)!.status;

describe("news status from the validity dates", () => {
  it("Active while valid, Scheduled before, Expired after", () => {
    expect(statusFor("2026-10-01", "2026-12-31")).toBe("active");
    expect(statusFor("2026-11-01", "2026-12-31")).toBe("scheduled");
    expect(statusFor("2026-01-01", "2026-02-01")).toBe("expired");
  });

  it("open dates count as valid", () => {
    expect(statusFor(null, null)).toBe("active");
    expect(statusOf(null, new Date("2026-12-31"), now)).toBe("active");
  });

  it("the badge names the status", () => {
    for (const [status, label] of [
      ["active", "Active"],
      ["scheduled", "Scheduled"],
      ["expired", "Expired"],
    ] as const) {
      render(<NewsStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeTruthy();
      cleanup();
    }
  });
});
