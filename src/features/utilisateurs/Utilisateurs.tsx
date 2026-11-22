import { useEffect, useState, FormEvent } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth } from "../../shared/firebase";
import { ROLES, Profil, Role } from "./types";
import Modal from "../../shared/components/Modal";

type Ligne = Profil & { id: string };

export default function Utilisateurs() {
  const [liste, setListe] = useState<Ligne[]>([]);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("secretaire");
  const [erreur, setErreur] = useState("");
  const [rolesDemandes, setRolesDemandes] = useState<Partial<Record<string, Role>>>({});
  const [erreurStatut, setErreurStatut] = useState("");
  const [ouvert, setOuvert] = useState(false);

  useEffect(
    () =>
      onSnapshot(collection(db, "utilisateurs"), (s) =>
        setListe(s.docs.map((d) => ({ id: d.id, ...(d.data() as Profil) })))
      ),
    []
  );

  const ouvrir = () => {
    setNom("");
    setEmail("");
    setPassword("");
    setRole("secretaire");
    setErreur("");
    setOuvert(true);
  };

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(db, "utilisateurs", cred.user.uid), { nom, email, role, actif: true });
      await signOut(secondaryAuth);
      setOuvert(false);
    } catch (x) {
      setErreur((x as Error).message);
    }
  };

  const changerStatut = async (u: Ligne) => {
    setErreurStatut("");
    try {
      const ref = doc(db, "utilisateurs", u.id);
      if (u.enAttente) {
        const roleChoisi = rolesDemandes[u.id];
        if (!roleChoisi) return;
        await updateDoc(ref, { role: roleChoisi, actif: true, enAttente: false });
      } else {
        await updateDoc(ref, { actif: !u.actif });
      }
    } catch {
      setErreurStatut("Impossible de modifier le statut du compte.");
    }
  };

  return (
    <section>
      <div className="entete">
        <h2>Utilisateurs</h2>
        <button onClick={ouvrir}>Ajouter</button>
      </div>

      <Modal ouvert={ouvert} titre="Créer un compte" onClose={() => setOuvert(false)}>
        <form className="formulaire" onSubmit={creer}>
          <label>
            Nom complet
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </label>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Mot de passe provisoire
            <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label>
            Rôle
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          {erreur && <p className="erreur">{erreur}</p>}
          <div className="actions">
            <button type="button" className="secondaire" onClick={() => setOuvert(false)}>
              Annuler
            </button>
            <button type="submit">Créer le compte</button>
          </div>
        </form>
      </Modal>

      {erreurStatut && <p className="erreur" role="alert">{erreurStatut}</p>}
      <div className="defile">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((u) => (
              <tr key={u.id}>
                <td>{u.nom}</td>
                <td>{u.email}</td>
                <td>{u.enAttente ? (
                  <select aria-label={`Rôle pour ${u.nom}`} value={rolesDemandes[u.id] ?? ""}
                    onChange={(e) => setRolesDemandes({ ...rolesDemandes, [u.id]: e.target.value as Role })}>
                    <option value="">Choisir un rôle</option>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                ) : u.role}</td>
                <td>{u.enAttente ? "En attente" : u.actif ? "Actif" : "Désactivé"}</td>
                <td>
                  <button className="lien" disabled={u.enAttente && !rolesDemandes[u.id]}
                    onClick={() => changerStatut(u)}>
                    {u.enAttente ? "Approuver" : u.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
