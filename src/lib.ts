export interface Eleve {
  id: string; matricule: string; nom: string; prenom: string; classe: string;
  dateNaissance?: string; tuteur?: string; contact?: string; statut?: string;
}
export interface Tarifs { inscription: number; ecolage: number; infrastructure: number; moisDebut: string; nbMois: number }
export interface Paiement {
  id: string; eleveId: string; type: "inscription" | "ecolage" | "infrastructure";
  mois?: string | null; montant: number; mode: string; recu: string; date: string;
}
export interface Matiere { id: string; nom: string; coefficient: number }
export interface Note { eleveId: string; matiereId: string; valeur: number; bareme: number; type?: string; periode?: string }
export interface Absence {
  id: string; eleveId: string; eleveNom: string; classe: string; date: string; periode: string;
  type: "Absence" | "Retard"; justifiee: boolean; motif: string;
}

export const PERIODES = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];
export const ar = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} Ar`;
export const moisCle = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const listeMois = (debut: string, nb: number): string[] => {
  const [a, m] = debut.split("-").map(Number);
  return Array.from({ length: nb }, (_, i) => moisCle(new Date(a, m - 1 + i, 1)));
};
export const nomMois = (k: string) =>
  new Date(`${k}-01T00:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export const TYPES_EVAL = ["Devoir 1", "Devoir 2", "Interrogation", "Examen"];
export const f2 = (n: number | null) => (n === null ? "—" : n.toFixed(2));

export type Statut = "Payé" | "Partiel" | "En retard" | "À payer" | "À venir";
export const statutDe = (paye: number, du: number, mois?: string): Statut => {
  if (du > 0 && paye >= du) return "Payé";
  if (mois && mois < moisCle()) return "En retard";
  if (paye > 0) return "Partiel";
  return mois && mois > moisCle() ? "À venir" : "À payer";
};

// Moyenne par matière (notes ramenées sur 20), puis moyenne générale pondérée.
// Une matière sans note est ignorée : elle ne compte jamais comme zéro.
export const calculBulletin = (eleveId: string, matieres: Matiere[], notes: Note[]) => {
  const lignes = matieres.map((m) => {
    const ns = notes.filter((n) => n.eleveId === eleveId && n.matiereId === m.id);
    const moy = ns.length ? ns.reduce((s, n) => s + (n.valeur / n.bareme) * 20, 0) / ns.length : null;
    return { m, ns, moy };
  });
  const ok = lignes.filter((l) => l.moy !== null);
  const coef = ok.reduce((s, l) => s + l.m.coefficient, 0);
  const moyenne = coef ? ok.reduce((s, l) => s + (l.moy as number) * l.m.coefficient, 0) / coef : null;
  return { lignes, moyenne };
};
export type ResultatBulletin = ReturnType<typeof calculBulletin>;

export const apprecier = (m: number | null) =>
  m === null ? "—" : m >= 16 ? "Excellent travail" : m >= 14 ? "Très bien" : m >= 12 ? "Bien" : m >= 10 ? "Passable" : "Insuffisant : doit redoubler d'efforts";

export const rangDans = (moyennes: (number | null)[], m: number | null) => {
  const valides = moyennes.filter((x): x is number => x !== null).sort((a, b) => b - a);
  return m === null ? "—" : `${valides.indexOf(m) + 1} / ${valides.length}`;
};
