export type Role =
  | "admin"
  | "directeur"
  | "secretaire"
  | "enseignant"
  | "caissier"
  | "surveillant";

export const ROLES: Role[] = [
  "admin",
  "directeur",
  "secretaire",
  "enseignant",
  "caissier",
  "surveillant",
];

export interface Profil {
  nom: string;
  email: string;
  role: Role;
  actif: boolean;
}
