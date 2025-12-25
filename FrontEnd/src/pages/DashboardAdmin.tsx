import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "../api/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

type FilterOptions = {
  wilayas: string[];
  communes: string[];
  sectors: string[];
};

type DashboardSummary = {
  totals: {
    totalContacts: number;
    totalSamplesGivenToContacts: number;
  };
  sectorBreakdown: Array<{ sector: string; count: number; percentage: number }>;
};

type QuestionBreakdown = {
  id: string;
  questionText: string;
  totalAnswers: number;
  options: Array<{ option: string; count: number; percentage: number }>;
};

const PIE_COLORS = [
  "#111827",
  "#2563EB",
  "#16A34A",
  "#F59E0B",
  "#DC2626",
  "#7C3AED",
  "#0EA5E9",
  "#F97316",
  "#10B981",
  "#6B7280",
];

function buildConicGradient(
  slices: Array<{ percentage: number }>,
  colors: string[]
): string {
  let current = 0;
  const parts: string[] = [];

  for (let i = 0; i < slices.length; i++) {
    const pct = Math.max(0, Math.min(100, Number(slices[i].percentage) || 0));
    const start = current;
    const end = current + pct;
    const color = colors[i % colors.length];
    parts.push(`${color} ${start}% ${end}%`);
    current = end;
  }

  if (parts.length === 0) {
    return "conic-gradient(#E5E7EB 0% 100%)";
  }

  if (current < 100) {
    parts.push(`#E5E7EB ${current}% 100%`);
  }

  return `conic-gradient(${parts.join(", ")})`;
}

function Pie({
  title,
  totalLabel,
  totalValue,
  slices,
}: {
  title: string;
  totalLabel: string;
  totalValue: number;
  slices: Array<{ label: string; count: number; percentage: number }>;
}) {
  const gradient = useMemo(
    () => buildConicGradient(slices, PIE_COLORS),
    [slices]
  );

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <div className="mb-3">
        <div className="text-sm font-semibold text-black">{title}</div>
        <div className="text-xs text-black/50">
          {totalLabel}: <span className="font-medium text-black">{totalValue}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr] md:items-center">
        <div
          className="h-[160px] w-[160px] rounded-full border border-black/10"
          style={{ backgroundImage: gradient }}
        />

        <div className="space-y-2">
          {slices.length === 0 ? (
            <div className="text-sm text-black/60">Aucune donnée.</div>
          ) : (
            slices.map((s, idx) => (
              <div key={`${s.label}-${idx}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-3 w-3 rounded-sm border border-black/10"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <div className="text-sm text-black truncate">{s.label}</div>
                </div>
                <div className="text-sm text-black/70 tabular-nums whitespace-nowrap">
                  {s.count} ({s.percentage.toFixed(1)}%)
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [wilaya, setWilaya] = useState<string>("");
  const [commune, setCommune] = useState<string>("");
  const [sector, setSector] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const [options, setOptions] = useState<FilterOptions>({
    wilayas: [],
    communes: [],
    sectors: [],
  });

  const [summary, setSummary] = useState<DashboardSummary>({
    totals: { totalContacts: 0, totalSamplesGivenToContacts: 0 },
    sectorBreakdown: [],
  });

  const [questions, setQuestions] = useState<QuestionBreakdown[]>([]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (wilaya) params.set("wilaya", wilaya);
    if (commune) params.set("commune", commune);
    if (sector) params.set("sector", sector);
    if (date) params.set("date", date);
    return params;
  }, [wilaya, commune, sector, date]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (wilaya) params.set("wilaya", wilaya);
      const endpoint = params.toString()
        ? `/admin/dashboard/filters?${params.toString()}`
        : "/admin/dashboard/filters";

      const res = await authenticatedFetch(endpoint, { method: "GET" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load filter options");
      }
      const payload = (await res.json()) as {
        success?: boolean;
        options?: FilterOptions;
      };
      setOptions({
        wilayas: payload.options?.wilayas || [],
        communes: payload.options?.communes || [],
        sectors: payload.options?.sectors || [],
      });
    } catch (e) {
      setOptions({ wilayas: [], communes: [], sectors: [] });
      throw e;
    }
  }, [wilaya]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const [summaryRes, questionsRes] = await Promise.all([
        authenticatedFetch(`/admin/dashboard/summary${suffix}`, { method: "GET" }),
        authenticatedFetch(`/admin/dashboard/questions${suffix}`, { method: "GET" }),
      ]);

      if (!summaryRes.ok) {
        const err = await summaryRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load dashboard summary");
      }
      if (!questionsRes.ok) {
        const err = await questionsRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load questions breakdown");
      }

      const summaryPayload = (await summaryRes.json()) as {
        totals?: DashboardSummary["totals"];
        sectorBreakdown?: DashboardSummary["sectorBreakdown"];
      };
      const questionsPayload = (await questionsRes.json()) as {
        questions?: QuestionBreakdown[];
      };

      setSummary({
        totals: {
          totalContacts: summaryPayload.totals?.totalContacts || 0,
          totalSamplesGivenToContacts:
            summaryPayload.totals?.totalSamplesGivenToContacts || 0,
        },
        sectorBreakdown: summaryPayload.sectorBreakdown || [],
      });

      setQuestions(questionsPayload.questions || []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load admin dashboard"
      );
      setSummary({
        totals: { totalContacts: 0, totalSamplesGivenToContacts: 0 },
        sectorBreakdown: [],
      });
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void loadFilterOptions().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load filter options");
    });
  }, [loadFilterOptions]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    setCommune("");
  }, [wilaya]);

  const sectorSlices = useMemo(() => {
    return (summary.sectorBreakdown || []).map((s) => ({
      label: s.sector,
      count: s.count,
      percentage: s.percentage,
    }));
  }, [summary.sectorBreakdown]);

  const hasAnyFilter = Boolean(wilaya || commune || sector || date);

  return (
    <div className="p-6">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Tableau de bord</h1>
          <p className="text-sm text-black/60">
            Statistiques globales.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:w-[220px]"
            >
              <option value="">Toutes les wilayas</option>
              {options.wilayas.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            <select
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              disabled={!wilaya}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50 md:w-[220px]"
            >
              <option value="">Toutes les communes</option>
              {options.communes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:w-[260px]"
            >
              <option value="">Tous les secteurs</option>
              {options.sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="md:w-[180px]"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setWilaya("");
                setCommune("");
                setSector("");
                setDate("");
              }}
              disabled={loading || !hasAnyFilter}
            >
              Réinitialiser
            </Button>
          </div>

          <div className="text-sm text-black/60">
            {loading ? "Chargement..." : ""}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-xs font-medium text-black/60">Contacts</div>
            <div className="mt-2 text-2xl font-semibold text-black">
              {loading ? "—" : summary.totals.totalContacts}
            </div>
                   </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-xs font-medium text-black/60">
              Échantillons donnés 
            </div>
            <div className="mt-2 text-2xl font-semibold text-black">
              {loading ? "—" : summary.totals.totalSamplesGivenToContacts}
            </div>
            
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <Pie
            title="Répartition par secteur"
            totalLabel="Total contacts"
            totalValue={summary.totals.totalContacts}
            slices={sectorSlices}
          />
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-semibold text-black">
            Répartition des réponses par question
          </div>

          {loading ? (
            <div className="rounded-xl border border-black/10 bg-white p-5 text-sm text-black/60">
              Chargement...
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-white p-5 text-sm text-black/60">
              Aucune donnée.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q) => (
                <Pie
                  key={q.id}
                  title={q.questionText}
                  totalLabel="Total réponses"
                  totalValue={q.totalAnswers}
                  slices={(q.options || []).map((o) => ({
                    label: o.option,
                    count: o.count,
                    percentage: o.percentage,
                  }))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}