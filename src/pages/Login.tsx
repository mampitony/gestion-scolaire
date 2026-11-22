import { useState, FormEvent } from "react";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    try {
      await login(email, password);
    } catch {
      setErreur("E-mail ou mot de passe incorrect.");
    }
  };

  return (
    <div className="centre">
      <form className="carte" onSubmit={envoyer}>
        <h1>Gestion scolaire</h1>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {erreur && <p className="erreur">{erreur}</p>}
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
