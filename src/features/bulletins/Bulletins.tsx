import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../shared/firebase";
import BulletinCarte from "./BulletinCarte";
import { Absence } from "../absences/types";
import { Eleve } from "../eleves/types";
import { Matiere } from "../matieres/types";
import { Note } from "../notes/evaluations";
import { PERIODES } from "../../shared/periodes";
import { calculBulletin, rangDans } from "./calculs";

export default function Bulletins() {
  const [classes, setClasses] = useState<{ id: string; nom: string }[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [classeSel, setClasse] = useState("");
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [erreur, setErreur] = useState("");
  const classe = classeSel || classes[0]?.nom || "";

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "classes"), (s) => setClasses(s.docs.map((d) => ({ id: d.id, nom: d.data().nom }))));
    const u2 = onSnapshot(collection(db, "matieres"), (s) => setMatieres(s.docs.map((d) => ({ id: d.id, ...d.data() } as Matiere))));
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    if (!classe) return;
    setErreur("");
    getDocs(query(collection(db, "eleves"), where("classe", "==", classe)))
      .then((s) => setEleves(s.docs.map((d) => ({ id: d.id, ...d.data() } as Eleve)).sort((a, b) => a.nom.localeCompare(b.nom))))
      .catch((e) => setErreur(e.message));
    getDocs(query(collection(db, "notes"), where("classe", "==", classe), where("periode", "==", periode)))
      .then((s) => setNotes(s.docs.map((d) => d.data() as Note)))
      .catch((e) => setErreur(e.message));
    getDocs(query(collection(db, "absences"), where("classe", "==", classe), where("periode", "==", periode)))
      .then((s) => setAbsences(s.docs.map((d) => ({ id: d.id, ...d.data() } as Absence))))
      .catch((e) => setErreur(e.message));
  }, [classe, periode]);

  const resultats = eleves.map((e) => ({ e, res: calculBulletin(e.id, matieres, notes) }));
  const moyennes = resultats.map((r) => r.res.moyenne);

  return (
    <section>
      <div className="entete no-print">
        <h2>Bulletins de notes</h2>
        <button onClick={() => window.print()} disabled={!eleves.length}>Imprimer / Enregistrer en PDF</button>
      </div>
      <div className="barre no-print">
        <label>Classe<select value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((c) => <option key={c.id}>{c.nom}</option>)}</select></label>
        <label>Période<select value={periode} onChange={(e) => setPeriode(e.target.value)}>{PERIODES.map((p) => <option key={p}>{p}</option>)}</select></label>
      </div>
      {erreur && <p className="erreur">{erreur}</p>}
      {!eleves.length && <p className="vide">Aucun élève dans cette classe.</p>}
      {resultats.map(({ e, res }) => (
        <BulletinCarte
          key={e.id}
          eleve={e}
          classe={classe}
          periode={periode}
          resultat={res}
          rang={rangDans(moyennes, res.moyenne)}
          absences={absences.filter((a) => a.eleveId === e.id)}
        />
      ))}
    </section>
  );
}
