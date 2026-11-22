# Gestion scolaire

## Démarrer

Installez Node.js 22 ou une version ultérieure, puis lancez `npm ci`. Configurez les six variables `VITE_FIREBASE_…` dans votre fichier local `.env` à partir de la configuration de l’application Web Firebase. Activez la connexion par e-mail et mot de passe et publiez `firestore.rules` dans Firestore.

Lancez `npm run dev` pour travailler sur l’interface et `npm run build` pour vérifier la compilation.

## Changement d’adresse administrateur

Le menu **Mon compte** est accessible aux administrateurs existants. L’adresse stockée dans leur profil Firestore doit correspondre à leur adresse de connexion Firebase. Le changement conserve l’UID et le rôle du compte. L’historique personnel affiche les actions de gestion des comptes effectuées depuis le dernier changement d’adresse. Les actions précédentes sont conservées dans la collection `journalAdmin`. Le journal commence à collecter les actions lors de l’installation de cette version.

Ajoutez ces variables dans le tableau de bord Netlify pour l’environnement **Production**, avec la portée **Functions** si elle est proposée.

| Variable | Valeur |
| --- | --- |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | Le contenu JSON d’un compte de service du même projet Firebase, autorisé à gérer les utilisateurs et les documents Firestore |
| `ADMIN_EMAIL_CODE_SECRET` | Un secret aléatoire réservé au serveur, distinct de la clé Resend |
| `RESEND_API_KEY` | Une clé d’envoi Resend |
| `ADMIN_EMAIL_FROM` | L’adresse d’expédition sur un domaine vérifié dans Resend |

Pour générer le secret dans PowerShell avec Node.js installé, exécutez `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Enregistrez le résultat uniquement dans Netlify. Conservez les variables serveur sans préfixe `VITE_` et hors de GitHub.

Envoyez le projet sur GitHub, publiez les règles Firestore et lancez un déploiement Netlify. Vérifiez l’envoi et la confirmation sur un compte de test avant d’utiliser la fonction avec un compte de production. En cas d’interruption après la modification de la connexion, reconnectez-vous avec la nouvelle adresse, sélectionnez **J’ai déjà reçu un code** et ressaisissez le code pour terminer la synchronisation.

Pour tester la fonction en local, utilisez Netlify Dev et les mêmes variables serveur avec un projet Firebase de test.
