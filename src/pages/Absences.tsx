import { useEffect, useState, FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import Modal from "../components/Modal";
import { Absence, Eleve, PERIODES } from "../lib";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export default function Absences() {
  const { profil } = useAuth();
  const [classes, setClasses] = useState<{ id: string; nom: string }[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [filtre, setFiltre] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState("");
  const [f, setF] = useState({ classe: "", eleveId: "", date: aujourdhui(), periode: PERIODES[0], type: "Absence", justifiee: "Non", motif: "" });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "classes"), (s) => setClasses(s.docs.map((d) => ({ id: d.id, nom: d.data().nom }))));
    const u2 = onSnapshot(collection(db, "eleves"), (s) => setEleves(s.docs.map((d) => ({ id: d.id, ...d.data() } as Eleve))));
    const u3 = onSnapshot(collection(db, "absences"), (s) => setAbsences(s.docs.map((d) => ({ id: d.id, ...d.data() } as Absence))));
    return () => { u1(); u2(); u3(); };
  }, []);

  const classeForm = f.classe || classes[0]?.nom || "";
  const elevesClasse = eleves.filter((e) => e.classe === classeForm).sort((a, b) => a.nom.localeCompare(b.nom));
  const eleveId = elevesClasse.some((e) => e.id === f.eleveId) ? f.eleveId : elevesClasse[0]?.id ?? "";
  const peutSupprimer = ["admin", "directeur", "secretaire"].includes(profil?.role ?? "");

  const enregistrer = async (ev: FormEvent) => {
    ev.preventDefault();
    setErreur("");
    const e = eleves.find((x) => x.id === eleveId);
    if (!e) { setErreur("Choisissez un élève."); return; }
    try {
      await addDoc(collection(db, "absences"), {
        eleveId: e.id, eleveNom: `${e.nom} ${e.prenom}`, classe: e.classe, date: f.date, periode: f.periode,
        type: f.type, justifiee: f.justifiee === "Oui", motif: f.motif, par: profil?.nom ?? "", createdAt: serverTimestamp(),
      });
      setOuvert(false);
    } catch (x) { setErreur((x as Error).message); }
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cet enregistrement ?")) return;
    try { await deleteDoc(doc(db, "absences", id)); } catch (x) { alert((x as Error).message); }
  };

  const visibles = absences
    .filter((a) => !filtre || a.classe === filtre)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section>
      <div className="entete">
        <h2>Absences et retards</h2>
        <button onClick={() => { setErreur(""); setOuvert(true); }}>Ajouter</button>
      </div>

      <Modal ouvert={ouvert} titre="Ajouter : absence ou retard" onClose={() => setOuvert(false)}>
        <form className="formulaire" onSubmit={enregistrer}>
          <label>Classe
            <select value={classeForm} onChange={(e) => setF({ ...f, classe: e.target.value, eleveId: "" })}>
              {classes.map((c) => <option key={c.id}>{c.nom}</option>)}
            </select>
          </label>
          <label>Élève
            <select value={eleveId} onChange={(e) => setF({ ...f, eleveId: e.target.value })}>
              {elevesClasse.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
          </label>
          <label>Date<input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label>Période
            <select value={f.periode} onChange={(e) => setF({ ...f, periode: e.target.value })}>
              {PERIODES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label>Type
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option>Absence</option><option>Retard</option>
            </select>
          </label>
          <label>Justifiée
            <select value={f.justifiee} onChange={(e) => setF({ ...f, justifiee: e.target.value })}>
              <option>Non</option><option>Oui</option>
            </select>
          </label>
          <label>Motif (facultatif)<input value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} /></label>
          {erreur && <p className="erreur">{erreur}</p>}
          <div className="actions">
            <button type="button" className="secondaire" onClick={() => setOuvert(false)}>Annuler</button>
            <button type="submit">Enregistrer</button>
          </div>
        </form>
      </Modal>

      <div className="barre">
        <label>Classe
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">Toutes</option>
            {classes.map((c) => <option key={c.id}>{c.nom}</option>)}
          </select>
        </label>
      </div>

      {visibles.length === 0 ? <p className="vide">Aucune absence enregistrée.</p> : (
        <div className="defile">
          <table>
            <thead><tr><th>Date</th><th>Élève</th><th>Classe</th><th>Période</th><th>Type</th><th>Justifiée</th><th>Motif</th>{peutSupprimer && <th />}</tr></thead>
            <tbody>
              {visibles.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td><td>{a.eleveNom}</td><td>{a.classe}</td><td>{a.periode}</td><td>{a.type}</td>
                  <td>{a.justifiee ? "Oui" : "Non"}</td><td>{a.motif}</td>
                  {peutSupprimer && <td><button className="lien" onClick={() => supprimer(a.id)}>Supprimer</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
