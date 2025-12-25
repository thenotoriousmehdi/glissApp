import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "../api/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type AnimatorStatRow = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  supervisorName: string | null;
  binomeCode: string | null;
  totalContacts: number;
  totalSamplesGiven: number;
  totalSamplesReceived: number;
  samplesLeft: number;
};

function formatDateForApi(dateInput: string): string {
  return dateInput;
}

export default function Rendement() {
  const [rows, setRows] = useState<AnimatorStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState("");
  const [date, setDate] = useState<string>("");

  const loadStats = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.set("date", formatDateForApi(selectedDate));
      }

      const endpoint = params.toString()
        ? `/chef/animators-stats?${params.toString()}`
        : "/chef/animators-stats";

      const res = await authenticatedFetch(endpoint, { method: "GET" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load stats");
      }

      const payload = (await res.json()) as {
        success?: boolean;
        data?: AnimatorStatRow[];
      };

      setRows(payload.data || []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats(date);
  }, [date, loadStats]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const haystack = [
        r.fullName,
        r.phoneNumber || "",
        r.supervisorName || "",
        r.binomeCode || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search]);

  return (
    <div className="p-6">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Rendement</h1>
          <p className="text-sm text-black/60">
            Statistiques des animateurs (contacts + échantillons).
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone, binôme..."
              className="md:w-[320px]"
            />

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
                setDate("");
              }}
              disabled={loading || !date}
            >
              Réinitialiser
            </Button>
          </div>

          <div className="text-sm text-black/60">
            {loading
              ? "Chargement..."
              : `${filteredRows.length} animateur(s) trouvé(s)`}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Superviseur</TableHead>
                <TableHead>Binôme</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Échantillons donnés</TableHead>
                <TableHead>Échantillons reçus</TableHead>
                <TableHead>Reste</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-black/60">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-black/60">
                    Aucun résultat.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-black">
                      {r.fullName || "N/A"}
                    </TableCell>
                    <TableCell>{r.phoneNumber || "—"}</TableCell>
                    <TableCell>{r.supervisorName || "—"}</TableCell>
                    <TableCell>{r.binomeCode || "—"}</TableCell>
                    <TableCell>{r.totalContacts}</TableCell>
                    <TableCell>{r.totalSamplesGiven}</TableCell>
                    <TableCell>{r.totalSamplesReceived}</TableCell>
                    <TableCell className={r.samplesLeft < 0 ? "text-red-600" : ""}>
                      {r.samplesLeft}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
