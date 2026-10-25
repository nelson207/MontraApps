// Colour roles (values in platform/styles/insights.scss, validated with the dataviz validator).
// Categorical slots are assigned in this fixed order, never cycled: past 5, fold into "Other".

export const SERIES = [1, 2, 3, 4, 5].map((n) => `var(--viz-series-${n})`);

/** Ordered stages (funnel): one blue, light → dark */
export const ORDINAL = [1, 2, 3, 4].map((n) => `var(--viz-ordinal-${n})`);

/** Colour of slot i (0-based); a 6th+ series never gets a generated hue */
export const seriesColor = (i: number) => SERIES[Math.min(i, SERIES.length - 1)];
