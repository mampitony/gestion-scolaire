import { useState, FormEvent } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { useAuth } from "../auth";
import { secondaryAuth } from "../firebase";

export default function Login() {
  const { login } = useAuth();
  const [inscription, setInscription] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (enCours) return;
    setErreur("");
    setMessage("");
    if (inscription && !nom.trim()) {
      setErreur("Saisissez votre nom complet.");
      return;
    }

    setEnCours(true);
    try {
      if (!inscription) {
        await login(email.trim(), password);
        return;
      }

      // Une nouvelle tentative peut compléter un compte Auth créé avant un échec Firestore.
      const compte = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)
        .catch((error) => {
          if (error.code !== "auth/email-already-in-use") throw error;
          return signInWithEmailAndPassword(secondaryAuth, email.trim(), password);
        });
      await setDoc(doc(getFirestore(secondaryAuth.app), "utilisateurs", compte.user.uid), {
        nom: nom.trim(),
        email: compte.user.email,
        role: "secretaire",
        actif: false,
        enAttente: true,
      });
      setInscription(false);
      setPassword("");
      setMessage("Votre demande a été envoyée. Attendez l’approbation de l’administrateur.");
    } catch {
      setErreur(inscription
        ? "Impossible d’envoyer la demande. Vérifiez vos informations. Si vous avez déjà un compte, connectez-vous."
        : "Connexion impossible. Vérifiez votre e-mail et votre mot de passe.");
    } finally {
      if (inscription) await signOut(secondaryAuth);
      setEnCours(false);
    }
  };

  return (
    <div className="centre">
      <form className="carte" onSubmit={envoyer}>
        <h1>{inscription ? "Créer un compte" : "Gestion scolaire"}</h1>
        {inscription && (
          <label>
            Nom complet
            <input autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120} required />
          </label>
        )}
        <label>
          E-mail
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input type="password" autoComplete={inscription ? "new-password" : "current-password"}
            minLength={inscription ? 6 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        {message && <p role="status">{message}</p>}
        <button type="submit" disabled={enCours}>{inscription ? "Envoyer la demande" : "Se connecter"}</button>
        <button type="button" className="lien" disabled={enCours} onClick={() => {
          setInscription(!inscription);
          setPassword("");
          setErreur("");
          setMessage("");
        }}>
          {inscription ? "Retour à la connexion" : "Créer un compte"}
        </button>
      </form>
    </div>
  );
}
