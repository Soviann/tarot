/**
 * Shared Recharts mock for jsdom tests.
 *
 * Usage in test files:
 *   vi.mock("recharts", () => import("../mocks/recharts"));
 *   // or from deeper paths:
 *   vi.mock("recharts", () => import("../../mocks/recharts"));
 */
export const Cell = ({ fill }: { fill: string }) => <div data-fill={fill} data-testid="cell" />;
export const Legend = () => <div data-testid="legend" />;
export const Line = ({ dataKey, stroke }: { dataKey: string; stroke?: string }) => <div data-stroke={stroke} data-testid={`line-${dataKey}`} />;
export const LineChart = ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
  <div data-point-count={data?.length} data-testid="line-chart">{children}</div>
);
export const Pie = ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
  <div data-entry-count={data.length} data-testid="pie">{children}</div>
);
export const PieChart = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pie-chart">{children}</div>
);
export const ReferenceLine = () => <div data-testid="reference-line" />;
export const ResponsiveContainer = ({ children, minHeight, minWidth }: { children: React.ReactNode; minHeight?: number; minWidth?: number }) => (
  <div data-min-height={minHeight} data-min-width={minWidth} data-testid="responsive-container">{children}</div>
);
export const Tooltip = () => <div data-testid="tooltip" />;
export const XAxis = () => <div data-testid="x-axis" />;
export const YAxis = () => <div data-testid="y-axis" />;
