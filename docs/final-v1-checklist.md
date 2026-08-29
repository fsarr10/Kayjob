# Checklist V1 KayJob

## ✅ Terminé

- Application publique unique à la racine sans site vitrine distinct.
- Interface KayJob avec identité visuelle, navigation, dashboard et parcours de gestion.
- Recherche nationale multi-villes avec logique remote vs sur place.
- Profils publics avec portfolio image/lien.
- Ajout local de réalisations sur un profil.
- Publication locale de services.
- Publication locale de missions.
- Commande escrow simulée avec statuts.
- Messagerie par commande.
- Validation de livraison et avis.
- Ouverture de litige et suivi admin.
- Espace client/prestataire/notifications.
- Back-office statistiques, vérifications, paiements et régions.
- API Node.js fonctionnelle avec /health OK.
- Base de données Neon connectée et variables runtime prêtes.
- Build statique validé avec `npm run build`.
- Configuration SenePay ajoutée dans les variables d’environnement.

## 🔜 À finaliser pour production

- Déployer l’API sur Render avec les variables secrètes de production.
- Déployer le front racine sur le service web public.
- Renseigner les clés SenePay production et le webhook secret exact.
- Vérifier le flux complet paiement → séquestre → livraison → libération.
- Confirmer les domaines publics et CORS de production.
