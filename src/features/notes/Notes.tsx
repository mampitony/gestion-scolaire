import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "../../shared/firebase";
import { useAuth } from "../login/auth";
import { Eleve } from "../eleves/types";
import { Matiere } from "../matieres/types";
import { PERIODES } from "../../shared/periodes";

const TYPES = ["Devoir 1", "Devoir 2", "Interrogation", "Examen"];

export default function Notes() {
  const { user, profil } = useAuth();
  const [classes, setClasses] = useState<{ id: string; nom: string }[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classeSel, setClasse] = useState("");
  const [matiereSel, setMatiere] = useState("");
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [type, setType] = useState(TYPES[0]);
  const [bareme, setBareme] = useState("20");
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const classe = classeSel || classes[0]?.nom || "";
  const matiereId = matiereSel || matieres[0]?.id || "";

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "classes"), (s) => setClasses(s.docs.map((d) => ({ id: d.id, nom: d.data().nom }))));
    const u2 = onSnapshot(collection(db, "matieres"), (s) => setMatieres(s.docs.map((d) => ({ id: d.id, ...d.data() } as Matiere))));
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    if (!classe) return;
    return onSnapshot(query(collection(db, "eleves"), where("classe", "==", classe)), (s) =>
      setEleves(s.docs.map((d) => ({ id: d.id, ...d.data() } as Eleve))));
  }, [classe]);

  // Recharge les notes déjà saisies par cet enseignant pour cette évaluation
  useEffect(() => {
    if (!user || !classe || !matiereId) return;
    getDocs(query(collection(db, "notes"), where("enseignantUid", "==", user.uid), where("classe", "==", classe),
      where("matiereId", "==", matiereId), where("periode", "==", periode), where("type", "==", type)))
      .then((s) => setValeurs(Object.fromEntries(s.docs.map((d) => [d.data().eleveId, String(d.data().valeur)]))))
      .catch((e) => setMsg(e.message));
  }, [user, classe, matiereId, periode, type]);

  const enregistrer = async () => {
    if (!user) return;
    setMsg("");
    try {
      const b = Number(bareme);
      const mat = matieres.find((m) => m.id === matiereId)!;
      const batch = writeBatch(db);
      let n = 0;
      for (const e of eleves) {
        const v = valeurs[e.id];
        if (v === undefined || v === "") continue; // note manquante : jamais convertie en zéro
        const val = Number(v);
        if (isNaN(val) || val < 0 || val > b) throw new Error(`Note invalide pour ${e.nom} ${e.prenom} (0 à ${b}).`);
        batch.set(doc(db, "notes", `${e.id}_${matiereId}_${periode}_${type}`.replace(/\s+/g, "-")), {
          eleveId: e.id, eleveNom: `${e.nom} ${e.prenom}`, classe, matiereId, matiereNom: mat.nom, periode, type,
          valeur: val, bareme: b, enseignantUid: user.uid, enseignantNom: profil?.nom ?? "", updatedAt: serverTimestamp(),
        });
        n++;
      }
      await batch.commit();
      setMsg(`${n} note(s) enregistrée(s).`);
    } catch (x) { setMsg((x as Error).message); }
  };

  if (!classes.length || !matieres.length)
    return <section><h2>Saisie des notes</h2><p className="vide">Ajoutez d'abord au moins une classe et une matière.</p></section>;

  return (
    <section>
      <h2>Saisie des notes</h2>
      <div className="barre">
        <label>Classe<select value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((c) => <option key={c.id}>{c.nom}</option>)}</select></label>
        <label>Matière<select value={matiereId} onChange={(e) => setMatiere(e.target.value)}>{matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></label>
        <label>Période<select value={periode} onChange={(e) => setPeriode(e.target.value)}>{PERIODES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Évaluation<select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Barème<input type="number" min={1} value={bareme} onChange={(e) => setBareme(e.target.value)} style={{ width: "5rem" }} /></label>
      </div>
      {eleves.length === 0 ? <p className="vide">Aucun élève dans cette classe.</p> : (
        <div className="defile">
          <table>
            <thead><tr><th>Matricule</th><th>Élève</th><th>Note /{bareme}</th></tr></thead>
            <tbody>
              {eleves.map((e) => (
                <tr key={e.id}>
                  <td>{e.matricule}</td><td>{e.nom} {e.prenom}</td>
                  <td><input type="number" step="0.25" value={valeurs[e.id] ?? ""} placeholder="absent" style={{ width: "6rem" }}
                    onChange={(ev) => setValeurs({ ...valeurs, [e.id]: ev.target.value })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {msg && <p>{msg}</p>}
      <div className="actions"><button onClick={enregistrer}>Enregistrer les notes</button></div>
    </section>
  );
}
