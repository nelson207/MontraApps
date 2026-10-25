import { describe, expect, it } from "vitest";
import { changeOf, conversion, formatValue, niceScale, sharesOf } from "./insightsModel";

describe("formatValue", () => {
  it("auto-compacts numbers", () => {
    expect(formatValue(1284, "number")).toBe("1,284");
    expect(formatValue(12_900, "number")).toBe("12.9K");
    expect(formatValue(980, "number")).toBe("980");
  });

  it("formats euros, compact past ten thousand", () => {
    expect(formatValue(4_200_000, "currency")).toBe("€4.2M");
    expect(formatValue(8_500, "currency")).toBe("€8,500");
    expect(formatValue(126_400, "currency")).toBe("€126.4K");
  });

  it("formats percentages", () => expect(formatValue(37.25, "percent")).toBe("37.3%"));
});

describe("changeOf", () => {
  it("signed % change vs the previous period, and whether it's good", () => {
    expect(changeOf(120, 100, true)).toEqual({ text: "+20%", direction: "up", good: true });
    expect(changeOf(80, 100, true)).toEqual({ text: "−20%", direction: "down", good: false });
    expect(changeOf(80, 100, false)).toEqual({ text: "−20%", direction: "down", good: true });
  });

  it("flat, and no previous value", () => {
    expect(changeOf(100, 100, true)).toEqual({ text: "0%", direction: "flat", good: null });
    expect(changeOf(5, 0, true)).toBeNull();
  });

  it("percent KPIs change in points", () =>
    expect(changeOf(42.5, 40, true, "percent")).toEqual({ text: "+2.5 pp", direction: "up", good: true }));
});

describe("sharesOf", () => {
  it("whole percentages that always add up to 100 (largest remainder)", () => {
    const shares = sharesOf([1, 1, 1]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
    expect(shares).toEqual([34, 33, 33]);
    expect(sharesOf([18, 7, 3])).toEqual([64, 25, 11]);
  });

  it("all zeros stay zero", () => expect(sharesOf([0, 0])).toEqual([0, 0]));
});

describe("niceScale", () => {
  it("rounds the axis up to clean ticks", () => {
    expect(niceScale(87)).toEqual({ max: 100, ticks: [0, 25, 50, 75, 100] });
    expect(niceScale(1_234)).toEqual({ max: 1_500, ticks: [0, 500, 1_000, 1_500] });
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
  });
});

describe("conversion", () => {
  it("share of the previous stage, one decimal", () => {
    expect(conversion(40, 100)).toBe(40);
    expect(conversion(1, 3)).toBe(33.3);
    expect(conversion(5, 0)).toBe(0);
  });
});
