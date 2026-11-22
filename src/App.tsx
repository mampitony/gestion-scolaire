import { useState } from "react";
import { useAuth } from "./features/login/auth";
import Login from "./features/login/Login";
import Utilisateurs from "./features/utilisateurs/Utilisateurs";
import Eleves from "./features/eleves/Eleves";
import Frais from "./features/frais/Frais";
import Notes from "./features/notes/Notes";
import Bulletins from "./features/bulletins/Bulletins";
import DossierEleve from "./features/dossier-eleve/DossierEleve";
import Absences from "./features/absences/Absences";
import Classes from "./features/classes/Classes";
import Matieres from "./features/matieres/Matieres";
import "./shared/styles/extra.css";

type Onglet = [string, string];

export default function App() {
  const { user, profil, loading, logout } = useAuth();
  const [onglet, setOnglet] = useState("eleves");

  if (loading) return <p className="centre">Chargement…</p>;
  if (!user) return <Login />;
  if (!profil || !profil.actif || profil.enAttente)
    return (
      <div className="centre">
        <div className="carte">
          <p>{profil?.enAttente
            ? "Votre compte est en attente d’approbation par l’administrateur."
            : "Ce compte n’a pas de profil actif. Contactez l’administrateur."}</p>
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </div>
    );

  const r = profil.role;
  const a = (...roles: string[]) => roles.includes(r);
  const onglets: Onglet[] = [
    ...(a("admin") ? ([["utilisateurs", "Utilisateurs"]] as Onglet[]) : []),
    ...(a("admin", "directeur", "secretaire") ? ([["eleves", "Élèves"], ["dossier", "Dossier élève"], ["classes", "Classes"], ["matieres", "Matières"]] as Onglet[]) : []),
    ...(a("admin", "directeur", "secretaire", "caissier") ? ([["frais", "Frais de scolarité"]] as Onglet[]) : []),
    ...(a("admin", "directeur", "enseignant") ? ([["notes", "Saisie des notes"]] as Onglet[]) : []),
    ...(a("admin", "directeur", "secretaire", "surveillant") ? ([["absences", "Absences"]] as Onglet[]) : []),
    ...(a("admin", "directeur", "secretaire") ? ([["bulletins", "Bulletins"]] as Onglet[]) : []),
  ];
  const actif = onglets.some(([k]) => k === onglet) ? onglet : onglets[0]?.[0];

  return (
    <div className="app">
      <aside>
        <strong className="marque">Gestion scolaire</strong>
        <nav>
          {onglets.map(([k, l]) => (
            <button key={k} className={k === actif ? "on" : ""} onClick={() => setOnglet(k)}>
              {l}
            </button>
          ))}
        </nav>
        <div className="qui">
          <span>{profil.nom}</span>
          <small>{profil.role}</small>
          <button className="lien" onClick={logout}>Déconnexion</button>
        </div>
      </aside>

      <main>
        {!actif && <p className="vide">Les modules de votre rôle seront ajoutés prochainement.</p>}
        {actif === "utilisateurs" && <Utilisateurs />}
        {actif === "eleves" && <Eleves />}
        {actif === "frais" && <Frais />}
        {actif === "notes" && <Notes />}
        {actif === "dossier" && <DossierEleve />}
        {actif === "absences" && <Absences />}
        {actif === "bulletins" && <Bulletins />}
        {actif === "classes" && <Classes />}
        {actif === "matieres" && <Matieres />}
      </main>
    </div>
  );
}
