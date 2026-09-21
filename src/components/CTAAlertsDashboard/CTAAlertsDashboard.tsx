'use client';

import { useMemo, useEffect,useState } from 'react';
import type { CTALine, CTAServiceAlert } from '../../types/alerts';
import { aggregateAlertsByLine } from '../../utils/chartHelpers';
import { AlertsRadialChart } from '../AlertsRadialChart/AlertsRadialChart';
import { LineBreakdownChart } from '../analytics/LineBreakdownChart/LineBreakdownChart';

const LINE_STYLES: Record<CTALine, { base: string; active: string; dot: string }> = {
  Red: {
    base: 'border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-700',
    active: 'border-red-500 bg-red-50 text-red-700',
    dot: 'bg-red-600',
  },
  Blue: {
    base: 'border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-700',
    active: 'border-blue-500 bg-blue-50 text-blue-700',
    dot: 'bg-blue-600',
  },
  Brown: {
    base: 'border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-700',
    active: 'border-amber-600 bg-amber-50 text-amber-700',
    dot: 'bg-amber-700',
  },
  Green: {
    base: 'border-slate-300 text-slate-700 hover:border-green-400 hover:text-green-700',
    active: 'border-green-500 bg-green-50 text-green-700',
    dot: 'bg-green-600',
  },
  Orange: {
    base: 'border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-700',
    active: 'border-orange-500 bg-orange-50 text-orange-700',
    dot: 'bg-orange-600',
  },
  Purple: {
    base: 'border-slate-300 text-slate-700 hover:border-violet-400 hover:text-violet-700',
    active: 'border-violet-500 bg-violet-50 text-violet-700',
    dot: 'bg-violet-600',
  },
  Pink: {
    base: 'border-slate-300 text-slate-700 hover:border-pink-400 hover:text-pink-700',
    active: 'border-pink-500 bg-pink-50 text-pink-700',
    dot: 'bg-pink-600',
  },
  Yellow: {
    base: 'border-slate-300 text-slate-700 hover:border-yellow-400 hover:text-yellow-700',
    active: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    dot: 'bg-yellow-500',
  },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700',
  major: 'bg-amber-100 text-amber-700',
  minor: 'bg-slate-100 text-slate-700',
};

const CTAAlertsDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLines, setSelectedLines] = useState<CTALine[]>([]);

  // Live API states
  const [rawAlerts, setRawAlerts] = useState<CTAServiceAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveAlerts() {
      try {
        setLoading(true);
        const res = await fetch('/api/cta/alerts');

        if (!res.ok) {
          throw new Error(`Failed to fetch alerts: ${res.statusText}`);
        }

        const data = await res.json();
        setRawAlerts(data.alerts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLiveAlerts();
  }, []);

  // Filter alerts based on search term and selected lines
  const filteredAlerts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return rawAlerts.filter((alert) => {
      const searchableText = [
        alert.headline,
        alert.shortDescription,
        alert.fullDescription,
        ...alert.impactedServices.map((service) => service.routeName),
      ]
        .join(' ')
        .toLowerCase();

      const matchesText = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
      const matchesLines =
        selectedLines.length === 0 ||
        alert.impactedServices.some((service) => service.lineColor && selectedLines.includes(service.lineColor));

      return matchesText && matchesLines;
    });
  }, [rawAlerts, searchTerm, selectedLines]);

  // Calculate summary statistics
  const totalAlerts = filteredAlerts.length;
  const criticalDisruptions = filteredAlerts.filter((alert) => alert.severity === 'critical').length;
  const affectedLines = useMemo(() => {
    const lineSet = new Set<CTALine>();

    // Collect unique line colors
    filteredAlerts.forEach((alert) => {
      alert.impactedServices.forEach((service) => {
        if (service.lineColor) {
          lineSet.add(service.lineColor);
        }
      });
    });

    return lineSet.size;
  }, [filteredAlerts]);

  const timestamp = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const toggleLine = (line: CTALine) => {
    setSelectedLines((current) =>
      current.includes(line) ? current.filter((value) => value !== line) : [...current, line],
    );
  };

  // Calculate chart data reactively from filtered alerts
  const aggregatedAlerts = useMemo(() => {
    return aggregateAlertsByLine(filteredAlerts, selectedLines);
  }, [filteredAlerts]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <p className="text-sm font-medium text-slate-500">Loading alerts...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <p className="text-sm font-medium text-rose-600">Error loading alerts: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                CTA System Alerts (Live Snapshot)
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Transit Alert Metrics (TAM)
              </h1>
            </div>
            <p className="text-sm font-medium text-slate-600">
              Live Data — Updated at {timestamp}
            </p>
          </div>

          {/* Metrics Summary */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-slate-50">
              <p className="text-sm text-slate-400">Total Active Alerts</p>
              <p className="mt-2 text-3xl font-semibold">{totalAlerts}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Critical Disruptions</p>
              <p className="mt-2 text-3xl font-semibold text-rose-600">{criticalDisruptions}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Affected Lines</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{affectedLines}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex-1">
                <span className="sr-only">Search alerts</span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search station names or headlines"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {(['Red', 'Blue', 'Brown', 'Green', 'Orange', 'Purple', 'Pink', 'Yellow'] as CTALine[]).map((line) => {
                  const isActive = selectedLines.includes(line);
                  const styles = LINE_STYLES[line];

                  return (
                    <button
                      key={line}
                      type="button"
                      onClick={() => toggleLine(line)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        isActive ? styles.active : styles.base
                      }`}
                    >
                      <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                      {line}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two-column layout for charts and alerts list */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-auto lg:h-100 grid gap-6 lg:col-span-1">
              <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-400">Weekly Summary</p>
                <LineBreakdownChart />
              </div>

              <div className="h-64 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-400">Active Alerts (L Train)</p>
                <AlertsRadialChart data={aggregatedAlerts} />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                {filteredAlerts.map((alert) => {
                  const primaryLine = alert.impactedServices.find((service) => service.lineColor)?.lineColor;
                  const accentClass = primaryLine ? LINE_STYLES[primaryLine].dot : 'bg-slate-400';

                  return (
                    <article
                      key={alert.id}
                      className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 pl-6 shadow-sm"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${accentClass}`} />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">{alert.headline}</h2>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{alert.shortDescription}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${SEVERITY_STYLES[alert.severity]}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {alert.impactedServices.map((service) => (
                          <span
                            key={`${alert.id}-${service.routeId}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {service.routeName}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CTAAlertsDashboard;
