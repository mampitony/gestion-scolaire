export interface Tarifs { inscription: number; ecolage: number; infrastructure: number; moisDebut: string; nbMois: number }
export interface Paiement {
  id: string; eleveId: string; type: "inscription" | "ecolage" | "infrastructure";
  mois?: string | null; montant: number; mode: string; recu: string; date: string;
}

export const ar = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} Ar`;
export const moisCle = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const listeMois = (debut: string, nb: number): string[] => {
  const [a, m] = debut.split("-").map(Number);
  return Array.from({ length: nb }, (_, i) => moisCle(new Date(a, m - 1 + i, 1)));
};
export const nomMois = (k: string) =>
  new Date(`${k}-01T00:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export type Statut = "Payé" | "Partiel" | "En retard" | "À payer" | "À venir";
export const statutDe = (paye: number, du: number, mois?: string): Statut => {
  if (du > 0 && paye >= du) return "Payé";
  if (mois && mois < moisCle()) return "En retard";
  if (paye > 0) return "Partiel";
  return mois && mois > moisCle() ? "À venir" : "À payer";
};
