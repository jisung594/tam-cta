'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  // LineBreakdownRaw,
  type LineBreakdownChartData,
  transformLineBreakdownData,
} from './line-breakdown-utils';

export function LineBreakdownChart() {
  const [chartData, setChartData] = useState<LineBreakdownChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeksAgo, setWeeksAgo] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics/line-breakdown?weeksAgo=${weeksAgo}`);
        const json = await res.json();
        const formatted = transformLineBreakdownData(json.data || []);
        setChartData(formatted);
      } catch (err) {
        console.error('Failed to load line breakdown data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [weeksAgo]);

  const getLabel = (offset: number) => {
    const now = new Date();
  
    // Calculate window end date (now - offset weeks)
    const endDate = new Date(now);
    endDate.setDate(now.getDate() - offset * 7);

    // Calculate window start date (end - 7 days)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    const format = (d: Date) => 
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const dateRange = `${format(startDate)} – ${format(endDate)}`;

    if (offset === 0) {
      return `Past 7 Days (${dateRange})`;
    }
    return `${offset} ${offset === 1 ? "Week" : "Weeks"} Prior (${dateRange})`;
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading Line Breakdown Chart...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-6 lg:p-3">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Planned vs. Unplanned Alerts
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aggregated service disruptions recorded over 7-day periods.
        </p>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 8, left: -8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="line" />
            <YAxis width={35}/>
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderColor: '#27272a',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend 
              align="left"
              wrapperStyle={{ padding:'16px', fontSize: '14px' }}
            />
            {/* Setting stackId="a" on both Bar components stacks them on top of each other */}
            <Bar dataKey="planned" name="Planned Maintenance" stackId="a" fill="#3b82f6" />
            <Bar dataKey="unplanned" name="Unplanned Delays" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Slider for weekly view */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-medium">
          <span>Timeframe</span>
          <span>{getLabel(weeksAgo)}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="7" 
          value={weeksAgo} 
          onChange={(e) => setWeeksAgo(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>
    </div>
  );
}