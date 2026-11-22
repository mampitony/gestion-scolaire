import CrudTable from "../../shared/components/CrudTable";

export default function Classes() {
  return (
    <CrudTable
      nom="classes"
      titre="Classes"
      champs={[
        { key: "nom", label: "Nom (ex. 6e A)" },
        { key: "niveau", label: "Niveau", type: "select", options: ["6e", "5e", "4e", "3e", "Seconde", "Première", "Terminale"] },
        { key: "anneeScolaire", label: "Année scolaire (ex. 2026-2027)" },
      ]}
    />
  );
}
