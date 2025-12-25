import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authenticatedFetch } from "../api/auth";

type AnimatorListItem = {
  id: string;
  fullName?: string;
};

export default function Rotation() {
  const [animators, setAnimators] = useState<AnimatorListItem[]>([]);
  const [loadingAnimators, setLoadingAnimators] = useState(true);
  const [selectedAnimatorId, setSelectedAnimatorId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAnimators(true);
      setError("");
      try {
        const res = await authenticatedFetch("/chef/animators", {
          method: "GET",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load animators");
        }

        const payload = (await res.json()) as {
          success?: boolean;
          animators?: AnimatorListItem[];
        };

        if (mounted) setAnimators(payload.animators || []);
      } catch (e) {
        if (mounted) {
          setAnimators([]);
          setError(e instanceof Error ? e.message : "Failed to load animators");
        }
      } finally {
        if (mounted) setLoadingAnimators(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const animatorOptions = useMemo(() => {
    return [...animators].sort((a, b) => {
      const aName = (a.fullName || "").toLowerCase();
      const bName = (b.fullName || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [animators]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAnimatorId || !quantity) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const quantityNumber = Number(quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError("La quantité doit être un nombre positif.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/chef/inventory", {
        method: "POST",
        body: JSON.stringify({
          animator_id: selectedAnimatorId,
          quantity: Math.trunc(quantityNumber),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l’enregistrement");
      }

      setSuccess("Rotation enregistrée avec succès.");
      setSelectedAnimatorId("");
      setQuantity("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l’envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Rotation</h1>
          <p className="text-sm text-black/60">
            Ajoutez une entrée de stock (inventory) pour un animateur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-black mb-4">Informations</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-black/70">
                  Animateur *
                </label>
                <select
                  value={selectedAnimatorId}
                  onChange={(e) => setSelectedAnimatorId(e.target.value)}
                  disabled={loadingAnimators}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50"
                >
                  <option value="">
                    {loadingAnimators ? "Chargement..." : "Sélectionner..."}
                  </option>
                  {animatorOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName || "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-black/70">Quantité *</label>
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  inputMode="numeric"
                  placeholder="Ex: 50"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting || loadingAnimators}
              className="bg-black text-white hover:bg-black/90"
            >
              {submitting ? "Envoi..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
