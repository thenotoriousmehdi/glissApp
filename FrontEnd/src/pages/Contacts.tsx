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

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  commune: string;
  wilaya: string;
  activationSector: string;
  samplesGiven: number;
  submittedAt: string | null;
  animatorId: string | null;
  animatorName: string | null;
  animatorBinomeCode: string | null;
  supervisorName: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function Contacts() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState("");
  const [animatorFilter, setAnimatorFilter] = useState<string>("");
  const [supervisorFilter, setSupervisorFilter] = useState<string>("");

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authenticatedFetch("/admin/contacts", { method: "GET" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load contacts");
      }

      const payload = (await res.json()) as {
        success?: boolean;
        contacts?: ContactRow[];
      };

      setRows(payload.contacts || []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const animatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.animatorName) {
        map.set(r.animatorName, r.animatorName);
      }
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const supervisorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.supervisorName) {
        map.set(r.supervisorName, r.supervisorName);
      }
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (animatorFilter && r.animatorName !== animatorFilter) return false;
      if (supervisorFilter && r.supervisorName !== supervisorFilter) return false;

      if (!q) return true;
      const haystack = [
        r.firstName,
        r.lastName,
        r.phoneNumber,
        r.wilaya,
        r.commune,
        r.activationSector,
        r.animatorName || "",
        r.supervisorName || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, animatorFilter, supervisorFilter]);

  return (
    <div className="p-6">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Contacts</h1>
          <p className="text-sm text-black/60">
            Liste des contacts.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone, wilaya..."
              className="md:w-[320px]"
            />

            <select
              value={animatorFilter}
              onChange={(e) => setAnimatorFilter(e.target.value)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:w-[240px]"
            >
              <option value="">Tous les animateurs</option>
              {animatorOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={supervisorFilter}
              onChange={(e) => setSupervisorFilter(e.target.value)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:w-[240px]"
            >
              <option value="">Tous les superviseurs</option>
              {supervisorOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setAnimatorFilter("");
                setSupervisorFilter("");
              }}
              disabled={loading}
            >
              Réinitialiser
            </Button>
          </div>

          <div className="text-sm text-black/60">
            {loading ? "Chargement..." : `${filteredRows.length} contact(s)`}
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
                <TableHead>Wilaya</TableHead>
                <TableHead>Commune</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Échantillons</TableHead>
                <TableHead>Animateur</TableHead>
                <TableHead>Superviseur</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-black/60">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-black/60">
                    Aucun résultat.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-black">
                      {r.lastName} {r.firstName}
                    </TableCell>
                    <TableCell>{r.phoneNumber}</TableCell>
                    <TableCell>{r.wilaya}</TableCell>
                    <TableCell>{r.commune}</TableCell>
                    <TableCell>{r.activationSector}</TableCell>
                    <TableCell>{r.samplesGiven}</TableCell>
                    <TableCell>{r.animatorName || "—"}</TableCell>
                    <TableCell>{r.supervisorName || "—"}</TableCell>
                    <TableCell>{formatDateTime(r.submittedAt)}</TableCell>
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