import { useEffect, useState, FormEvent } from "react";
import { collection, doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import Modal from "../components/Modal";
import { ar, listeMois, nomMois, statutDe, Statut, Eleve, Paiement, Tarifs } from "../lib";

type Type = Paiement["type"];

const Badge = ({ s }: { s: Statut }) => <span className="badge" data-s={s}>{s}</span>;

export default function Frais() {
  const { profil } = useAuth();
  const role = profil?.role ?? "";
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [tarifs, setTarifs] = useState<Tarifs | null>(null);
  const [choisi, setChoisi] = useState<Eleve | null>(null);
  const [recherche, setRecherche] = useState("");
  const [tarifOuvert, setTarifOuvert] = useState(false);
  const [f, setF] = useState({ type: "ecolage" as Type, mois: "", montant: "", mode: "Espèces" });
  const [tf, setTf] = useState({ inscription: "", ecolage: "", infrastructure: "", moisDebut: "2026-10", nbMois: "9" });
  const [info, setInfo] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "eleves"), (s) =>
      setEleves(s.docs.map((d) => ({ id: d.id, ...d.data() } as Eleve))));
    const u2 = onSnapshot(collection(db, "paiements"), (s) =>
      setPaiements(s.docs.map((d) => ({ id: d.id, ...d.data() } as Paiement))));
    const u3 = onSnapshot(doc(db, "parametres", "tarifs"), (s) =>
      setTarifs(s.exists() ? (s.data() as Tarifs) : null));
    return () => { u1(); u2(); u3(); };
  }, []);

  const moisList = tarifs ? listeMois(tarifs.moisDebut, tarifs.nbMois) : [];
  const somme = (id: string, type: Type, mois?: string) =>
    paiements.filter((p) => p.eleveId === id && p.type === type && (!mois || p.mois === mois))
      .reduce((s, p) => s + p.montant, 0);

  const lignes = (e: Eleve) => {
    if (!tarifs) return [];
    const base: { libelle: string; du: number; type: Type; mois?: string }[] = [
      { libelle: "Droit d'inscription", du: tarifs.inscription, type: "inscription" },
      ...moisList.map((m) => ({ libelle: `Écolage ${nomMois(m)}`, du: tarifs.ecolage, type: "ecolage" as Type, mois: m })),
      { libelle: "Frais d'infrastructure", du: tarifs.infrastructure, type: "infrastructure" },
    ];
    return base.map((l) => {
      const paye = somme(e.id, l.type, l.mois);
      return { ...l, paye, statut: statutDe(paye, l.du, l.mois) };
    });
  };

  const encaisser = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!choisi) return;
    setInfo(""); setErreur("");
    try {
      let recu = "";
      await runTransaction(db, async (tx) => {
        const rc = doc(db, "compteurs", "recu");
        const s = await tx.get(rc);
        const n = (s.exists() ? (s.data().valeur as number) : 0) + 1;
        recu = `R${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
        tx.set(rc, { valeur: n });
        tx.set(doc(collection(db, "paiements")), {
          eleveId: choisi.id, eleveNom: `${choisi.nom} ${choisi.prenom}`, matricule: choisi.matricule,
          type: f.type, mois: f.type === "ecolage" ? f.mois || moisList[0] : null,
          montant: Number(f.montant), mode: f.mode, recu,
          date: new Date().toISOString().slice(0, 10), par: profil?.nom ?? "", createdAt: serverTimestamp(),
        });
      });
      setInfo(`Paiement enregistré. Reçu n° ${recu}`);
      setF({ ...f, montant: "" });
    } catch (x) { setErreur((x as Error).message); }
  };

  const ouvrirTarifs = () => {
    if (tarifs) setTf({ ...tarifs, inscription: String(tarifs.inscription), ecolage: String(tarifs.ecolage),
      infrastructure: String(tarifs.infrastructure), nbMois: String(tarifs.nbMois) });
    setErreur(""); setTarifOuvert(true);
  };
  const enregistrerTarifs = async (ev: FormEvent) => {
    ev.preventDefault();
    try {
      await setDoc(doc(db, "parametres", "tarifs"), {
        inscription: Number(tf.inscription), ecolage: Number(tf.ecolage), infrastructure: Number(tf.infrastructure),
        moisDebut: tf.moisDebut, nbMois: Number(tf.nbMois),
      });
      setTarifOuvert(false);
    } catch (x) { setErreur((x as Error).message); }
  };

  const q = recherche.toLowerCase();
  const visibles = eleves.filter((e) => `${e.nom} ${e.prenom} ${e.matricule} ${e.classe}`.toLowerCase().includes(q));
  const peutTarifs = ["admin", "directeur"].includes(role);
  const peutEncaisser = ["admin", "directeur", "caissier"].includes(role);

  return (
    <section>
      <div className="entete">
        <h2>Frais de scolarité</h2>
        {peutTarifs && <button className="secondaire" onClick={ouvrirTarifs}>Tarifs</button>}
      </div>

      <Modal ouvert={tarifOuvert} titre="Tarifs de l'année (en ariary)" onClose={() => setTarifOuvert(false)}>
        <form className="formulaire" onSubmit={enregistrerTarifs}>
          <label>Droit d'inscription<input type="number" min={0} required value={tf.inscription} onChange={(e) => setTf({ ...tf, inscription: e.target.value })} /></label>
          <label>Écolage mensuel<input type="number" min={0} required value={tf.ecolage} onChange={(e) => setTf({ ...tf, ecolage: e.target.value })} /></label>
          <label>Frais d'infrastructure<input type="number" min={0} required value={tf.infrastructure} onChange={(e) => setTf({ ...tf, infrastructure: e.target.value })} /></label>
          <label>Premier mois d'écolage<input type="month" required value={tf.moisDebut} onChange={(e) => setTf({ ...tf, moisDebut: e.target.value })} /></label>
          <label>Nombre de mois<input type="number" min={1} max={12} required value={tf.nbMois} onChange={(e) => setTf({ ...tf, nbMois: e.target.value })} /></label>
          {erreur && <p className="erreur">{erreur}</p>}
          <div className="actions"><button type="submit">Enregistrer</button></div>
        </form>
      </Modal>

      <Modal ouvert={!!choisi} titre={choisi ? `${choisi.nom} ${choisi.prenom} (${choisi.matricule})` : ""} onClose={() => setChoisi(null)}>
        {choisi && (
          <>
            <div className="defile">
              <table>
                <thead><tr><th>Frais</th><th>Dû</th><th>Payé</th><th>Statut</th></tr></thead>
                <tbody>
                  {lignes(choisi).map((l) => (
                    <tr key={l.libelle}><td>{l.libelle}</td><td>{ar(l.du)}</td><td>{ar(l.paye)}</td><td><Badge s={l.statut} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {peutEncaisser && (
              <form className="formulaire" onSubmit={encaisser} style={{ marginTop: "1rem" }}>
                <strong>Encaisser un paiement</strong>
                <label>Type
                  <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Type })}>
                    <option value="ecolage">Écolage</option>
                    <option value="inscription">Droit d'inscription</option>
                    <option value="infrastructure">Infrastructure</option>
                  </select>
                </label>
                {f.type === "ecolage" && (
                  <label>Mois
                    <select value={f.mois || moisList[0]} onChange={(e) => setF({ ...f, mois: e.target.value })}>
                      {moisList.map((m) => <option key={m} value={m}>{nomMois(m)}</option>)}
                    </select>
                  </label>
                )}
                <label>Montant (Ar)<input type="number" min={1} required value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value })} /></label>
                <label>Mode
                  <select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>
                    <option>Espèces</option><option>Mobile money</option><option>Virement</option>
                  </select>
                </label>
                {info && <p>{info}</p>}
                {erreur && <p className="erreur">{erreur}</p>}
                <div className="actions"><button type="submit">Valider le paiement</button></div>
              </form>
            )}
          </>
        )}
      </Modal>

      {!tarifs ? (
        <p className="vide">Les tarifs ne sont pas encore définis. {peutTarifs ? "Cliquez sur « Tarifs »." : "Demandez à l'administrateur ou au directeur."}</p>
      ) : (
        <>
          <div className="barre"><input placeholder="Rechercher (nom, matricule, classe)" value={recherche} onChange={(e) => setRecherche(e.target.value)} /></div>
          <div className="defile">
            <table>
              <thead><tr><th>Matricule</th><th>Élève</th><th>Classe</th><th>Inscription</th><th>Écolage</th><th>Infrastructure</th><th /></tr></thead>
              <tbody>
                {visibles.map((e) => {
                  const l = lignes(e);
                  const retards = l.filter((x) => x.statut === "En retard").length;
                  return (
                    <tr key={e.id}>
                      <td>{e.matricule}</td><td>{e.nom} {e.prenom}</td><td>{e.classe}</td>
                      <td><Badge s={l[0].statut} /></td>
                      <td>{retards ? <span className="badge" data-s="En retard">{retards} mois en retard</span> : <span className="badge" data-s="Payé">À jour</span>}</td>
                      <td><Badge s={l[l.length - 1].statut} /></td>
                      <td><button className="lien" onClick={() => { setInfo(""); setErreur(""); setChoisi(e); }}>Détail</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
