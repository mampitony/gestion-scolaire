import type { Matiere } from "../matieres/types";
import type { Note } from "../notes/evaluations";

export const f2 = (n: number | null) => (n === null ? "—" : n.toFixed(2));

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
