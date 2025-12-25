import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authenticatedFetch } from "../api/auth";
import cities from "../lib/algeria_cities.json";

type CityRow = {
  id: number;
  commune_name_ascii: string;
  commune_name: string;
  daira_name_ascii: string;
  daira_name: string;
  wilaya_code: string;
  wilaya_name_ascii: string;
  wilaya_name: string;
};

type Question = {
  id: string;
  question_text: string;
  options: unknown;
};

type AnswerPayload = {
  question_id: string;
  selected_option: string;
};

const sectorOptions = [
  "Spa / Hammam",
  "Entreprise / Bureaux (At Work)",
  "Université / Cité universitaire",
  "Distribution Porte-à-porte (Door to Door)",
  "Rue / Centres d’intérêts (centres commerciaux, lieux de loisirs, événements, etc.)",
];

const samplesOptions = [
  "0",
  "1",
  "2",
  "3"
];

function getQuestionOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options.filter((o): o is string => typeof o === "string");
  }
  if (options && typeof options === "object") {
    const values = Object.values(options as Record<string, unknown>);
    return values.filter((v): v is string => typeof v === "string");
  }
  return [];
}

export default function AddContact() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [activationSector, setActivationSector] = useState("");
  const [samplesGiven, setSamplesGiven] = useState<string>("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const wilayaOptions = useMemo(() => {
    const rows = cities as CityRow[];
    const map = new Map<string, string>();
    for (const r of rows) {
      if (!map.has(r.wilaya_code)) map.set(r.wilaya_code, r.wilaya_name_ascii);
    }
    return [...map.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  const communeOptions = useMemo(() => {
    const rows = cities as CityRow[];
    if (!wilaya) return [] as { id: number; name: string }[];
    const filtered = rows.filter((r) => r.wilaya_code === wilaya);
    const map = new Map<string, { id: number; name: string }>();
    for (const r of filtered) {
      const key = r.commune_name_ascii;
      if (!map.has(key)) map.set(key, { id: r.id, name: r.commune_name_ascii });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [wilaya]);

  useEffect(() => {
    setCommune("");
  }, [wilaya]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingQuestions(true);
      setError("");
      try {
        const res = await authenticatedFetch("/questions/active", {
          method: "GET",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load questions");
        }
        const data = (await res.json()) as { questions: Question[] };
        if (mounted) setQuestions(data.questions || []);
      } catch (e) {
        if (mounted) {
          setQuestions([]);
          setError(e instanceof Error ? e.message : "Failed to load questions");
        }
      } finally {
        if (mounted) setLoadingQuestions(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !address ||
      !wilaya ||
      !commune ||
      !activationSector ||
      !samplesGiven
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const missingQuestion = questions.find((q) => !answers[q.id]);
    if (missingQuestion) {
      setError("Veuillez répondre à toutes les questions.");
      return;
    }

    const answerPayload: AnswerPayload[] = questions.map((q) => ({
      question_id: q.id,
      selected_option: answers[q.id],
    }));

    const samplesNumber = Number(samplesGiven);
    if (Number.isNaN(samplesNumber)) {
      setError("Le champ 'Nombre d’échantillons' doit être un nombre.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/contacts", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          address,
          commune,
          wilaya,
          activation_sector: activationSector,
          samples_given: samplesNumber,
          answers: answerPayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l’envoi du contact");
      }

      setSuccess("Contact ajouté avec succès.");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setAddress("");
      setWilaya("");
      setCommune("");
      setActivationSector("");
      setSamplesGiven("");
      setAnswers({});
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
          <h1 className="text-2xl font-semibold text-black">Ajouter un contact</h1>
          <p className="text-sm text-black/60">
            Remplissez les informations du contact et répondez aux questions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-black mb-4">Informations</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-black/70">Prénom *</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-black/70">Nom *</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-black/70">Téléphone *</label>
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-black/70">Adresse *</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              <div>
                <label className="text-xs font-medium text-black/70">Wilaya *</label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Sélectionner...</option>
                  {wilayaOptions.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-black/70">Commune *</label>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  disabled={!wilaya}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50"
                >
                  <option value="">Sélectionner...</option>
                  {communeOptions.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              <div>
                <label className="text-xs font-medium text-black/70">Secteur d’activation *</label>
                <select
                  value={activationSector}
                  onChange={(e) => setActivationSector(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Sélectionner...</option>
                  {sectorOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
               <div>
                <label className="text-xs font-medium text-black/70">Échantillons donnés*</label>
                <select
                  value={samplesGiven}
                  onChange={(e) => setSamplesGiven(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Sélectionner...</option>
                  {samplesOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-black mb-4">Questions</h2>

            {loadingQuestions ? (
              <div className="text-sm text-black/60">Chargement des questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-sm text-black/60">
                Aucune question active.
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => {
                  const opts = getQuestionOptions(q.options);
                  return (
                    <div key={q.id} className="space-y-2">
                      <div className="text-sm font-medium text-black">{q.question_text}</div>
                      <select
                        value={answers[q.id] || ""}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      >
                        <option value="">Sélectionner...</option>
                        {opts.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
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
              disabled={submitting || loadingQuestions}
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
