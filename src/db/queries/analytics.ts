import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Stacked Bar: Planned vs. Unplanned by Line
export async function getLineBreakdownData(weeksAgo: number = 0) {
  const result = await db.execute(sql`
    SELECT 
      s.line_color AS line_color,
      a.is_planned AS is_planned,
      COUNT(DISTINCT a.alert_id)::int AS alert_count
    FROM alerts a
    JOIN alert_impacted_services s ON a.alert_id = s.alert_id
    WHERE s.line_color IS NOT NULL
      AND a.event_start >= NOW() - (${weeksAgo + 1} * INTERVAL '7 days')
      AND a.event_start <  NOW() - (${weeksAgo} * INTERVAL '7 days')
    GROUP BY s.line_color, a.is_planned
    ORDER BY s.line_color;
  `);

  return result;
}
