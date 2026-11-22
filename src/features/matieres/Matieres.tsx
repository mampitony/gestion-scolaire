import CrudTable from "../../shared/components/CrudTable";

export default function Matieres() {
  return (
    <CrudTable
      nom="matieres"
      titre="Matières"
      champs={[
        { key: "nom", label: "Matière" },
        { key: "coefficient", label: "Coefficient", type: "number" },
      ]}
    />
  );
}
