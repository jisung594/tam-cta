export interface LineBreakdownRaw {
  line_color: string;
  is_planned: boolean;
  alert_count: number;
}

export interface LineBreakdownChartData {
  line: string;
  planned: number;
  unplanned: number;
}

export function transformLineBreakdownData(data: LineBreakdownRaw[]): LineBreakdownChartData[] {
  const lineMap = new Map<string, { planned: number; unplanned: number }>();

  data.forEach((item) => {
    const existing = lineMap.get(item.line_color) || { planned: 0, unplanned: 0 };
    if (item.is_planned) {
      existing.planned += item.alert_count;
    } else {
      existing.unplanned += item.alert_count;
    }
    lineMap.set(item.line_color, existing);
  });

  return Array.from(lineMap.entries()).map(([line, counts]) => ({
    line,
    planned: counts.planned,
    unplanned: counts.unplanned,
  }));
}