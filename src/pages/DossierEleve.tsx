import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import BulletinCarte from "../components/BulletinCarte";
import {
  Absence, Eleve, Matiere, Note, Paiement, PERIODES, Statut, Tarifs, TYPES_EVAL,
  ar, calculBulletin, f2, listeMois, nomMois, rangDans, statutDe,
} from "../lib";

const Badge = ({ s }: { s: Statut }) => <span className="badge" data-s={s}>{s}</span>;
const LIBELLE_TYPE = { inscription: "Droit d'inscription", ecolage: "Écolage", infrastructure: "Frais d'infrastructure" } as const;

export default function DossierEleve() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [tarifs, setTarifs] = useState<Tarifs | null>(null);
  const [recherche, setRecherche] = useState("");
  const [choisi, setChoisi] = useState<Eleve | null>(null);
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [notesClasse, setNotesClasse] = useState<Note[]>([]);
  const [erreur, setErreur] = useState("");
  const [solo, setSolo] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "eleves"), (s) => setEleves(s.docs.map((d) => ({ id: d.id, ...d.data() } as Eleve))));
    const u2 = onSnapshot(collection(db, "matieres"), (s) => setMatieres(s.docs.map((d) => ({ id: d.id, ...d.data() } as Matiere))));
    const u3 = onSnapshot(doc(db, "parametres", "tarifs"), (s) => setTarifs(s.exists() ? (s.data() as Tarifs) : null));
    return () => { u1(); u2(); u3(); };
  }, []);

  // Données propres à l'élève choisi (paiements, absences) + notes de sa classe (pour le rang)
  useEffect(() => {
    if (!choisi) return;
    setErreur("");
    const err = (e: Error) => setErreur(e.message);
    const u1 = onSnapshot(query(collection(db, "paiements"), where("eleveId", "==", choisi.id)),
      (s) => setPaiements(s.docs.map((d) => ({ id: d.id, ...d.data() } as Paiement))), err);
    const u2 = onSnapshot(query(collection(db, "absences"), where("eleveId", "==", choisi.id)),
      (s) => setAbsences(s.docs.map((d) => ({ id: d.id, ...d.data() } as Absence))), err);
    const u3 = onSnapshot(query(collection(db, "notes"), where("classe", "==", choisi.classe)),
      (s) => setNotesClasse(s.docs.map((d) => d.data() as Note)), err);
    return () => { u1(); u2(); u3(); };
  }, [choisi]);

  const imprimer = () => {
    setSolo(true);
    setTimeout(() => { window.print(); setSolo(false); }, 50);
  };

  if (!choisi) {
    const q = recherche.toLowerCase();
    const visibles = eleves
      .filter((e) => `${e.nom} ${e.prenom} ${e.matricule} ${e.classe}`.toLowerCase().includes(q))
      .sort((a, b) => a.nom.localeCompare(b.nom));
    return (
      <section>
        <div className="entete"><h2>Dossier élève</h2></div>
        <div className="barre"><input placeholder="Rechercher (nom, matricule, classe)" value={recherche} onChange={(e) => setRecherche(e.target.value)} /></div>
        {visibles.length === 0 ? <p className="vide">Aucun élève trouvé.</p> : (
          <div className="defile">
            <table>
              <thead><tr><th>Matricule</th><th>Élève</th><th>Classe</th><th /></tr></thead>
              <tbody>
                {visibles.map((e) => (
                  <tr key={e.id}>
                    <td>{e.matricule}</td><td>{e.nom} {e.prenom}</td><td>{e.classe}</td>
                    <td><button className="lien" onClick={() => { setPaiements([]); setAbsences([]); setNotesClasse([]); setChoisi(e); }}>Ouvrir le dossier</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  // --- Frais ---
  const moisList = tarifs ? listeMois(tarifs.moisDebut, tarifs.nbMois) : [];
  const somme = (type: Paiement["type"], mois?: string) =>
    paiements.filter((p) => p.type === type && (!mois || p.mois === mois)).reduce((s, p) => s + p.montant, 0);
  const lignesFrais = tarifs
    ? [
        { libelle: "Droit d'inscription", du: tarifs.inscription, type: "inscription" as const, mois: undefined as string | undefined },
        ...moisList.map((m) => ({ libelle: `Écolage ${nomMois(m)}`, du: tarifs.ecolage, type: "ecolage" as const, mois: m as string | undefined })),
        { libelle: "Frais d'infrastructure", du: tarifs.infrastructure, type: "infrastructure" as const, mois: undefined as string | undefined },
      ].map((l) => {
        const paye = somme(l.type, l.mois);
        return { ...l, paye, statut: statutDe(paye, l.du, l.mois) };
      })
    : [];
  const totalDu = lignesFrais.reduce((s, l) => s + l.du, 0);
  const totalPaye = lignesFrais.reduce((s, l) => s + Math.min(l.paye, l.du), 0);
  const retards = lignesFrais.filter((l) => l.statut === "En retard").length;

  // --- Notes / bulletin pour la période choisie ---
  const notesPeriode = notesClasse.filter((n) => n.periode === periode);
  const elevesClasse = eleves.filter((e) => e.classe === choisi.classe);
  const resultat = calculBulletin(choisi.id, matieres, notesPeriode);
  const rang = rangDans(elevesClasse.map((e) => calculBulletin(e.id, matieres, notesPeriode).moyenne), resultat.moyenne);
  const absencesPeriode = absences.filter((a) => a.periode === periode);

  const nbAbs = absences.filter((a) => a.type === "Absence");
  const nbRetards = absences.filter((a) => a.type === "Retard");

  return (
    <section className={solo ? "dossier solo" : "dossier"}>
      <div className="entete no-print">
        <h2>Dossier : {choisi.nom} {choisi.prenom}</h2>
        <button className="secondaire" onClick={() => setChoisi(null)}>← Retour à la liste</button>
      </div>
      {erreur && <p className="erreur no-print">{erreur}</p>}

      <div className="bloc no-print">
        <h3>Identité</h3>
        <p>
          Matricule {choisi.matricule} · Classe {choisi.classe} · Statut : {choisi.statut ?? "actif"}<br />
          Né(e) le : {choisi.dateNaissance || "—"} · Parent / tuteur : {choisi.tuteur || "—"} · Contact : {choisi.contact || "—"}
        </p>
        <div className="puces">
          <span className="puce"><small>Total dû</small><strong>{ar(totalDu)}</strong></span>
          <span className="puce"><small>Total payé</small><strong>{ar(totalPaye)}</strong></span>
          <span className="puce"><small>Reste à payer</small><strong>{ar(totalDu - totalPaye)}</strong></span>
          <span className="puce"><small>Mois d'écolage en retard</small><strong>{retards}</strong></span>
          <span className="puce"><small>Absences / retards</small><strong>{nbAbs.length} / {nbRetards.length}</strong></span>
        </div>
      </div>

      <div className="bloc no-print">
        <h3>Frais de scolarité</h3>
        {!tarifs ? <p className="vide">Les tarifs ne sont pas encore définis (onglet « Frais de scolarité »).</p> : (
          <div className="defile">
            <table>
              <thead><tr><th>Frais</th><th>Dû</th><th>Payé</th><th>Reste</th><th>Statut</th></tr></thead>
              <tbody>
                {lignesFrais.map((l) => (
                  <tr key={l.libelle}>
                    <td>{l.libelle}</td><td>{ar(l.du)}</td><td>{ar(l.paye)}</td><td>{ar(Math.max(l.du - l.paye, 0))}</td><td><Badge s={l.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h4>Historique des paiements</h4>
        {paiements.length === 0 ? <p className="vide">Aucun paiement enregistré.</p> : (
          <div className="defile">
            <table>
              <thead><tr><th>Date</th><th>Reçu</th><th>Type</th><th>Mois</th><th>Montant</th><th>Mode</th></tr></thead>
              <tbody>
                {[...paiements].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                  <tr key={p.id}>
                    <td>{p.date}</td><td>{p.recu}</td><td>{LIBELLE_TYPE[p.type]}</td><td>{p.mois ? nomMois(p.mois) : "—"}</td><td>{ar(p.montant)}</td><td>{p.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="barre no-print">
        <label>Période
          <select value={periode} onChange={(e) => setPeriode(e.target.value)}>{PERIODES.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
      </div>

      <div className="bloc no-print">
        <h3>Notes par matière : {periode}</h3>
        <div className="defile">
          <table>
            <thead><tr><th>Matière</th><th>Coef.</th>{TYPES_EVAL.map((t) => <th key={t}>{t}</th>)}<th>Moyenne /20</th></tr></thead>
            <tbody>
              {resultat.lignes.map((l) => (
                <tr key={l.m.id}>
                  <td>{l.m.nom}</td><td>{l.m.coefficient}</td>
                  {TYPES_EVAL.map((t) => {
                    const n = l.ns.find((x) => x.type === t);
                    return <td key={t}>{n ? `${n.valeur}/${n.bareme}` : "—"}</td>;
                  })}
                  <td>{f2(l.moy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><strong>Moyenne générale : {f2(resultat.moyenne)} /20</strong> · Rang : {rang}</p>
      </div>

      <div className="bloc no-print">
        <h3>Absences et retards</h3>
        {absences.length === 0 ? <p className="vide">Aucune absence enregistrée.</p> : (
          <div className="defile">
            <table>
              <thead><tr><th>Date</th><th>Période</th><th>Type</th><th>Justifiée</th><th>Motif</th></tr></thead>
              <tbody>
                {[...absences].sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
                  <tr key={a.id}><td>{a.date}</td><td>{a.periode}</td><td>{a.type}</td><td>{a.justifiee ? "Oui" : "Non"}</td><td>{a.motif}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="entete no-print"><h3>Bulletin</h3><button onClick={imprimer}>Imprimer / Enregistrer en PDF</button></div>
      <BulletinCarte eleve={choisi} classe={choisi.classe} periode={periode} resultat={resultat} rang={rang} absences={absencesPeriode} />
    </section>
  );
}
