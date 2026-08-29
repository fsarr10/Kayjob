# Guide d'accès - Interface Admin

## Comptes d'administration pour tester

Pour accéder à l'interface d'administration (menu Admin), utilisez l'un de ces comptes en mode démo :

### Email ou téléphone
- `admin@kayjob.sn` (email)
- `+221770000000` (téléphone)
- `admin` (pseudo)

### Mot de passe
Utilisez n'importe quel mot de passe de 6+ caractères pour la première connexion. Un compte sera créé automatiquement.

---

## Fonctionnalités du panel admin

### 1. **Tableau de bord admin**
- Nombre d'utilisateurs actifs
- Vérifications en attente
- Transactions escrow bloquées
- Litiges ouverts

### 2. **Vérifications en attente**
- Liste des profils à valider
- Actions : Valider ou Rejeter
- Notification automatique aux utilisateurs

### 3. **Escrow en attente**
- Transactions bloquées en séquestre
- Actions : Libérer le paiement ou Bloquer
- Suivi du statut des commandes

### 4. **Litiges ouverts**
- Liste des litiges à arbitrer
- Actions : Examiner ou Résoudre
- Historique des décisions

---

## Contrôle d'accès

- ✅ Seuls les comptes admin peuvent accéder à `/api/admin` ou au menu Admin
- ✅ Les utilisateurs non-admin ne verront pas le lien Admin
- ✅ Tentative d'accès à `#admin` sans droits = redirection automatique au dashboard
- ✅ Le rôle est vérifié côté client et côté serveur (backend)

---

## Données de test

Les données admin de test incluent :
- 3-8 profils en attente de vérification
- 1-2 transactions escrow à examiner
- 1+ litige ouvert à résoudre

