import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import CrudTable, { Champ } from "../components/CrudTable";

const champs: Champ[] = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prénom" },
  { key: "dateNaissance", label: "Date de naissance", type: "date" },
  { key: "classe", label: "Classe (ex. 6e A)" },
  { key: "tuteur", label: "Parent / tuteur" },
  { key: "contact", label: "Contact" },
];

// Matricule unique, permanent et jamais réutilisé (RG01) :
// le compteur et le dossier sont écrits dans la même transaction (RG10).
async function creerEleve(donnees: Record<string, any>) {
  await runTransaction(db, async (tx) => {
    const refCompteur = doc(db, "compteurs", "matricule");
    const snap = await tx.get(refCompteur);
    const n = (snap.exists() ? (snap.data().valeur as number) : 0) + 1;
    tx.set(refCompteur, { valeur: n });
    tx.set(doc(collection(db, "eleves")), {
      ...donnees,
      matricule: `E${new Date().getFullYear()}-${String(n).padStart(5, "0")}`,
      statut: "actif",
      createdAt: serverTimestamp(),
    });
  });
}

export default function Eleves() {
  return (
    <CrudTable
      nom="eleves"
      titre="Élèves"
      champs={champs}
      colonnesExtra={["matricule"]}
      onCreate={creerEleve}
      peutSupprimer={false}
    />
  );
}
