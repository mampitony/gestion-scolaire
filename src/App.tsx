import { useState } from "react";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Utilisateurs from "./pages/Utilisateurs";
import Eleves from "./pages/Eleves";
import Frais from "./pages/Frais";
import Notes from "./pages/Notes";
import Bulletins from "./pages/Bulletins";
import DossierEleve from "./pages/DossierEleve";
import Absences from "./pages/Absences";
import CrudTable from "./components/CrudTable";
import "./extra.css";

type Onglet = [string, string];

export default function App() {
  const { user, profil, loading, logout } = useAuth();
  const [onglet, setOnglet] = useState("eleves");

  if (loading) return <p className="centre">Chargement…</p>;
  if (!user) return <Login />;
  if (!profil || !profil.actif)
    return (
      <div className="centre">
        <div className="carte">
          <p>Ce compte n'a pas de profil actif. Contactez l'administrateur.</p>
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
        {actif === "classes" && (
          <CrudTable
            nom="classes"
            titre="Classes"
            champs={[
              { key: "nom", label: "Nom (ex. 6e A)" },
              { key: "niveau", label: "Niveau", type: "select", options: ["6e", "5e", "4e", "3e", "Seconde", "Première", "Terminale"] },
              { key: "anneeScolaire", label: "Année scolaire (ex. 2026-2027)" },
            ]}
          />
        )}
        {actif === "matieres" && (
          <CrudTable
            nom="matieres"
            titre="Matières"
            champs={[
              { key: "nom", label: "Matière" },
              { key: "coefficient", label: "Coefficient", type: "number" },
            ]}
          />
        )}
      </main>
    </div>
  );
}
