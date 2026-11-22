import { Absence } from "../absences/types";
import { Eleve } from "../eleves/types";
import { ResultatBulletin, apprecier, f2 } from "./calculs";
import { TYPES_EVAL } from "../notes/evaluations";

interface Props {
  eleve: Eleve;
  classe: string;
  periode: string;
  resultat: ResultatBulletin;
  rang: string;
  absences: Absence[];
}

export default function BulletinCarte({ eleve, classe, periode, resultat, rang, absences }: Props) {
  const abs = absences.filter((a) => a.type === "Absence");
  const retards = absences.filter((a) => a.type === "Retard");
  const nonJustifiees = abs.filter((a) => !a.justifiee).length;

  return (
    <article className="bulletin">
      <h3>Bulletin de notes : {periode}</h3>
      <p>
        <strong>{eleve.nom} {eleve.prenom}</strong> · Matricule {eleve.matricule} · Classe {classe}
      </p>
      <div className="defile">
        <table>
          <thead>
            <tr>
              <th>Matière</th><th>Coef.</th>
              {TYPES_EVAL.map((t) => <th key={t}>{t}</th>)}
              <th>Moyenne /20</th>
            </tr>
          </thead>
          <tbody>
            {resultat.lignes.map((l) => (
              <tr key={l.m.id}>
                <td>{l.m.nom}</td>
                <td>{l.m.coefficient}</td>
                {TYPES_EVAL.map((t) => {
                  const n = l.ns.find((x) => x.type === t);
                  return <td key={t}>{n ? (n.bareme === 20 ? n.valeur : `${n.valeur}/${n.bareme}`) : "—"}</td>;
                })}
                <td>{f2(l.moy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p><strong>Moyenne générale : {f2(resultat.moyenne)} /20</strong> · Rang : {rang}</p>
      <p>
        Absences : {abs.length} (dont {nonJustifiees} non justifiée{nonJustifiees > 1 ? "s" : ""}) · Retards : {retards.length}
      </p>
      <p>Appréciation : {apprecier(resultat.moyenne)}</p>
      <p className="signature">Signature de la direction : ______________________</p>
    </article>
  );
}
