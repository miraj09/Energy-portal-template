import React, { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CHART_FONT = "Arial, Helvetica, sans-serif";
const GRID_STROKE = "#e5e7ef";
const TICK_FILL = "#4b465c";

/** How far the top/side faces stick out (pseudo-3D depth). */
const BAR_DEPTH = 8;

const data = [
  { name: "Jan", commission: 500 },
  { name: "Feb", commission: 1500 },
  { name: "Mar", commission: 3500 },
  { name: "Apr", commission: 2500 },
  { name: "May", commission: 4500 },
  { name: "Jun", commission: 4000 },
  { name: "Jul", commission: 3000 },
  { name: "Aug", commission: 2000 },
  { name: "Sep", commission: 12000 },
  { name: "Oct", commission: 500 },
  { name: "Nov", commission: 12500 },
  { name: "Dec", commission: 3500 },
];

// Distinct fill per month so bars are easy to tell apart
const BAR_COLORS = [
  "#346fb6",
  "#2a9d8f",
  "#e9c46a",
  "#f4a261",
  "#e76f51",
  "#3d5a80",
  "#00b4d8",
  "#90be6d",
  "#f9844a",
  "#577590",
  "#43aa8b",
  "#f94144",
];

const Y_AXIS_STEP = 2000;
const Y_AXIS_DEFAULT_MAX = 10000;

/**
 * Builds Y-axis ticks in 2k steps.
 * Default ceiling is 10k; when data goes higher, adds another tick row per step.
 */
function getYAxisTicks(maxCommission: number): number[] {
  const ceiling = Math.max(
    Y_AXIS_DEFAULT_MAX,
    Math.ceil(maxCommission / Y_AXIS_STEP) * Y_AXIS_STEP
  );

  const ticks: number[] = [];
  for (let value = 0; value <= ceiling; value += Y_AXIS_STEP) {
    ticks.push(value);
  }
  return ticks;
}

function formatPound(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

/** Mix a hex color toward white (lighten) or black (darken). */
function shadeHex(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  const numeric = Number.parseInt(normalized, 16);
  const r = (numeric >> 16) & 0xff;
  const g = (numeric >> 8) & 0xff;
  const b = numeric & 0xff;

  const mix = (channel: number) => {
    if (amount >= 0) {
      return Math.round(channel + (255 - channel) * amount);
    }
    return Math.round(channel * (1 + amount));
  };

  const toHex = (channel: number) =>
    Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0");

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  index?: number;
  payload?: { fill?: string; name?: string };
};

/**
 * Custom bar renderer: front face + lighter top + darker side for a 3D look.
 * Recharts has no native 3D bars, so this is an isometric SVG simulation.
 */
function ThreeDBar(props: BarShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, payload } = props;

  if (height <= 0 || width <= 0) {
    return null;
  }

  const frontFill =
    props.fill || payload?.fill || BAR_COLORS[index % BAR_COLORS.length];
  const topFill = shadeHex(frontFill, 0.28);
  const sideFill = shadeHex(frontFill, -0.22);
  const depth = Math.min(BAR_DEPTH, width * 0.35);

  // Front face corners
  const x0 = x;
  const y0 = y;
  const x1 = x + width;
  const y1 = y + height;

  // Top face (parallelogram)
  const topPath = [
    `M ${x0} ${y0}`,
    `L ${x0 + depth} ${y0 - depth}`,
    `L ${x1 + depth} ${y0 - depth}`,
    `L ${x1} ${y0}`,
    "Z",
  ].join(" ");

  // Right side face (parallelogram)
  const sidePath = [
    `M ${x1} ${y0}`,
    `L ${x1 + depth} ${y0 - depth}`,
    `L ${x1 + depth} ${y1 - depth}`,
    `L ${x1} ${y1}`,
    "Z",
  ].join(" ");

  return (
    <g>
      <path d={sidePath} fill={sideFill} stroke="none" />
      <path d={topPath} fill={topFill} stroke="none" />
      <rect x={x0} y={y0} width={width} height={height} fill={frontFill} stroke="none" />
    </g>
  );
}

const maxCommission = Math.max(...data.map((entry) => entry.commission));
const yAxisTicks = getYAxisTicks(maxCommission);
const yAxisMax = yAxisTicks[yAxisTicks.length - 1];

const chartData = data.map((entry, index) => ({
  ...entry,
  fill: BAR_COLORS[index % BAR_COLORS.length],
}));

const RevenueBarChart = memo(() => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 18, right: 16, left: 4, bottom: 4 }}
        barCategoryGap="32%"
      >
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: TICK_FILL, fontSize: 12, fontFamily: CHART_FONT }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          domain={[0, yAxisMax]}
          ticks={yAxisTicks}
          tickFormatter={(value) => `${value / 1000}k`}
          width={40}
          tick={{ fill: TICK_FILL, fontSize: 12, fontFamily: CHART_FONT }}
        />
        <Tooltip
          cursor={{ fill: "rgba(52, 111, 182, 0.08)" }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e5e7ef",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
            fontSize: 13,
            fontFamily: CHART_FONT,
          }}
          labelStyle={{ color: TICK_FILL, fontWeight: 600, marginBottom: 4 }}
          formatter={(value) => [formatPound(Number(value)), "Commission"]}
        />
        <Bar
          dataKey="commission"
          name="Commission"
          maxBarSize={32}
          shape={(props: unknown) => (
            <ThreeDBar {...(props as BarShapeProps)} />
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

RevenueBarChart.displayName = "RevenueBarChart";

export default RevenueBarChart;
