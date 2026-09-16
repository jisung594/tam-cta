import { NextResponse } from 'next/server';
import type { 
  AffectedService,
  CTALine, 
  CTAServiceAlert, 
  CTAAlertsAPIResponse 
} from '@/types/alerts';

const CTA_ALERTS_URL = 'https://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON';

type TrainRouteCode = 'Red' | 'Blue' | 'Brn' | 'G' | 'Org' | 'Pnk' | 'P' | 'Y';
// Official CTA Route Configs: Maps route IDs to display names and brand hex colors
const LINE_MAP: Record<string, { line: CTALine; color: string }> = {
  Red: { line: 'Red', color: '#c0392b' },
  Blue: { line: 'Blue', color: '#2980b9' },
  Brn: { line: 'Brown', color: '#964B00' },
  G: { line: 'Green', color: '#27ae60' },
  Org: { line: 'Orange', color: '#d35400' },
  Pnk: { line: 'Pink', color: '#e84393' },
  P: { line: 'Purple', color: '#8e44ad' },
  Y: { line: 'Yellow', color: '#f1c40f' },
};

const TRAIN_ROUTE_CODES = new Set<string>(Object.keys(LINE_MAP));

// Return contract for Frontend / Recharts
export interface LineAlertSummary {
  line: string;
  count: number;
  color: string;
}

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const options: RequestInit & { next?: { revalidate?: number } } = {
      next: { revalidate: 30 },
      signal: controller.signal,
    };

    const response = await fetch(CTA_ALERTS_URL, options);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch live CTA alerts', status: response.status },
        { status: response.status }
      );
    }

    const data = (await response.json());
    const rawAlerts = data?.CTAAlerts?.Alert || [];
    const alertList = Array.isArray(rawAlerts) ? rawAlerts : [rawAlerts];

    // Initialize arrays and counts
    const detailedAlerts: CTAServiceAlert[] = [];

    const counts: Record<CTALine, number> = {
      Red: 0,
      Blue: 0,
      Brown: 0,
      Green: 0,
      Orange: 0,
      Pink: 0,
      Purple: 0,
      Yellow: 0,
    };

    // Transform raw CTA alerts
    alertList.forEach((alert: any) => {
      const services = alert?.ImpactedService?.Service || [];
      const serviceList = Array.isArray(services) ? services : [services];

      const affectedServices: AffectedService[] = [];

      serviceList.forEach((service: any) => {
        const rawCode = String(service?.ServiceId ?? '').trim();
        
        const lineColor =
          rawCode && LINE_MAP[rawCode]
            ? LINE_MAP[rawCode].line
            : undefined;

        if (lineColor) {
          counts[lineColor] += 1;
        }

        affectedServices.push({
          serviceType: lineColor ? 'L' : 'Bus',
          lineColor, // only valid CTA line names, never route names or IDs
          routeName: service.ServiceName || (lineColor ? `${lineColor} Line` : 'Bus Route'),
          routeId: rawCode || service.ServiceName || '',
        });

      });

      const parsedAlert: CTAServiceAlert = {
        id: String(alert.AlertId || Math.random()),
        headline: alert.Headline || 'Transit Alert',
        shortDescription: alert.ShortDescription || '',
        fullDescription: alert.FullDescription?.['#cdata-section'] || alert.ShortDescription || '',
        severity: Number(alert.SeverityScore || 0) >= 10 ? 'critical' : Number(alert.SeverityScore || 0) >= 5 ? 'major' : 'minor',
        isPlanned: alert.MajorAlert === '0', // 0 = Planned / Standard, 1 = Major / Emergency
        impactedServices: affectedServices,
        eventStart: alert.EventStart || '',
        eventEnd: alert.EventEnd || null,
      };

      detailedAlerts.push(parsedAlert);
    });

    // Format final response containing both summaries and detailed alerts
    const responsePayload: CTAAlertsAPIResponse = {
      summaries: Object.values(LINE_MAP).map(({ line, color }) => ({
        line,
        count: counts[line],
        color,
      })),
      alerts: detailedAlerts,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unable to reach CTA alerts endpoint',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
