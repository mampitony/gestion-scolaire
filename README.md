# Gestion scolaire (React + TypeScript + Vite + Firebase)

1. `npm install`
2. Copier `.env.example` en `.env` et y coller le `firebaseConfig`
3. Firebase : activer Authentication (E-mail/Mot de passe) et créer Firestore
4. Créer le premier admin : compte dans Authentication > Users, puis document
   `utilisateurs/<UID>` = { nom, email, role: "admin", actif: true }
5. Coller `firestore.rules` dans Firestore > Règles > Publier
6. `npm run dev`
