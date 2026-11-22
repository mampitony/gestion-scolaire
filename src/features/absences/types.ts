export interface Absence {
  id: string; eleveId: string; eleveNom: string; classe: string; date: string; periode: string;
  type: "Absence" | "Retard"; justifiee: boolean; motif: string;
}
