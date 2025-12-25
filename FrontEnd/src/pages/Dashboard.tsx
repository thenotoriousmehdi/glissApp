import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch } from "../api/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

type DashboardTotals = {
  totalContacts: number;
  totalSamplesGivenToContacts: number;
  totalSamplesDistributedToAnimators: number;
};

export default function Dashboard() {
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [totals, setTotals] = useState<DashboardTotals>({
    totalContacts: 0,
    totalSamplesGivenToContacts: 0,
    totalSamplesDistributedToAnimators: 0,
  });

  const loadDashboardStats = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);

      const endpoint = params.toString()
        ? `/chef/dashboard-stats?${params.toString()}`
        : "/chef/dashboard-stats";

      const res = await authenticatedFetch(endpoint, { method: "GET" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load dashboard stats");
      }

      const payload = (await res.json()) as {
        success?: boolean;
        totals?: DashboardTotals;
      };

      setTotals({
        totalContacts: payload.totals?.totalContacts || 0,
        totalSamplesGivenToContacts: payload.totals?.totalSamplesGivenToContacts || 0,
        totalSamplesDistributedToAnimators:
          payload.totals?.totalSamplesDistributedToAnimators || 0,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load dashboard stats"
      );
      setTotals({
        totalContacts: 0,
        totalSamplesGivenToContacts: 0,
        totalSamplesDistributedToAnimators: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardStats(date);
  }, [date, loadDashboardStats]);

  return (
    <div className="p-6">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Tableau de bord</h1>
          <p className="text-sm text-black/60">
            Vue d’ensemble des statistiques.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="md:w-[180px]"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => setDate("")}
              disabled={loading || !date}
            >
              Réinitialiser
            </Button>
          </div>

          <div className="text-sm text-black/60">
            {loading ? "Chargement..." : date ? `Filtré: ${date}` : "Tous les jours"}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-xs font-medium text-black/60">Contacts</div>
            <div className="mt-2 text-2xl font-semibold text-black">
              {loading ? "—" : totals.totalContacts}
            </div>
            <div className="mt-1 text-xs text-black/50">
              Total des contacts des animateurs
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-xs font-medium text-black/60">
              Échantillons distribués
            </div>
            <div className="mt-2 text-2xl font-semibold text-black">
              {loading ? "—" : totals.totalSamplesDistributedToAnimators}
            </div>
            <div className="mt-1 text-xs text-black/50">
              Reçu par les animateurs 
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <div className="text-xs font-medium text-black/60">
              Échantillons donnés
            </div>
            <div className="mt-2 text-2xl font-semibold text-black">
              {loading ? "—" : totals.totalSamplesGivenToContacts}
            </div>
            <div className="mt-1 text-xs text-black/50">
              Donnés aux contacts 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
