import { useEffect, useState, FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import Modal from "./Modal";

export interface Champ {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
}

type Row = { id: string } & Record<string, any>;

interface Props {
  nom: string; // nom de la collection Firestore
  titre: string;
  champs: Champ[];
  colonnesExtra?: string[];
  onCreate?: (donnees: Record<string, any>) => Promise<void>;
  peutSupprimer?: boolean;
}

export default function CrudTable({
  nom,
  titre,
  champs,
  colonnesExtra = [],
  onCreate,
  peutSupprimer = true,
}: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState(false);

  useEffect(
    () =>
      onSnapshot(collection(db, nom), (s) =>
        setRows(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    [nom]
  );

  const val = (c: Champ) => form[c.key] ?? (c.type === "select" ? c.options![0] : "");

  const ouvrir = () => {
    setForm({});
    setErreur("");
    setOuvert(true);
  };

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    try {
      const donnees = Object.fromEntries(
        champs.map((c) => [c.key, c.type === "number" ? Number(val(c)) : val(c)])
      );
      if (onCreate) await onCreate(donnees);
      else await addDoc(collection(db, nom), { ...donnees, createdAt: serverTimestamp() });
      setOuvert(false);
    } catch (x) {
      setErreur((x as Error).message);
    }
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cet enregistrement ?")) return;
    try {
      await deleteDoc(doc(db, nom, id));
    } catch (x) {
      alert((x as Error).message);
    }
  };

  const colonnes = [...colonnesExtra, ...champs.map((c) => c.key)];
  const libelle = (k: string) => champs.find((c) => c.key === k)?.label ?? k;

  return (
    <section>
      <div className="entete">
        <h2>{titre}</h2>
        <button onClick={ouvrir}>Ajouter</button>
      </div>

      <Modal ouvert={ouvert} titre={`Ajouter : ${titre.toLowerCase()}`} onClose={() => setOuvert(false)}>
        <form className="formulaire" onSubmit={enregistrer}>
          {champs.map((c) => (
            <label key={c.key}>
              {c.label}
              {c.type === "select" ? (
                <select value={val(c)} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}>
                  {c.options!.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={c.type ?? "text"}
                  value={val(c)}
                  required
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                />
              )}
            </label>
          ))}
          {erreur && <p className="erreur">{erreur}</p>}
          <div className="actions">
            <button type="button" className="secondaire" onClick={() => setOuvert(false)}>
              Annuler
            </button>
            <button type="submit">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {rows.length === 0 ? (
        <p className="vide">Aucun enregistrement. Cliquez sur « Ajouter » pour commencer.</p>
      ) : (
        <div className="defile">
          <table>
            <thead>
              <tr>
                {colonnes.map((k) => (
                  <th key={k}>{libelle(k)}</th>
                ))}
                {peutSupprimer && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {colonnes.map((k) => (
                    <td key={k}>{String(r[k] ?? "")}</td>
                  ))}
                  {peutSupprimer && (
                    <td>
                      <button className="lien" onClick={() => supprimer(r.id)}>
                        Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
