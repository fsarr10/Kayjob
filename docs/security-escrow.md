# KayJob - confiance, séquestre et paiements

Cette spécification accompagne `database/migrations/002_trust_escrow.sql`. Le dépôt ne contient pas encore l'API Laravel : la migration prépare Neon et le contrat ci-dessous doit être appliqué dans les contrôleurs, services et jobs Laravel.

## Règles non négociables

- Une commande ne passe à `escrowed` qu'après un webhook fournisseur authentifié, vérifié et traité une seule fois.
- `POST /orders/{id}/deliver-final` recharge la commande en base dans une transaction et refuse toute commande qui n'est pas payée et bloquée.
- Les fichiers originaux sont privés. Une URL signée courte est générée à la demande, jamais enregistrée comme lien public.
- Un aperçu image/vidéo est filigrané côté serveur. Les textes sont tronqués et le code est exposé sous forme de démo ou capture avant paiement.
- Le prestataire n'est crédité que par une écriture `release` dans `transactions` au passage à `completed_released`.
- Un job planifié libère automatiquement une commande après `review_deadline_at` si aucun litige n'est ouvert.
- Toute écriture financière porte une `idempotency_key` unique. Une répétition de webhook ne crée jamais une seconde écriture.
- Un avis est refusé par la contrainte trigger tant que la commande n'est pas `completed_released`.

## Machine de transitions

Les transitions doivent être centralisées dans un service Laravel `OrderStateMachine`. Une transition invalide lève une exception métier et est journalisée.

```text
draft -> awaiting_payment -> escrowed -> in_progress -> preview_delivered
preview_delivered -> final_delivered -> client_review -> completed_released
client_review -> dispute_opened -> dispute_resolved_client|dispute_resolved_provider
draft|awaiting_payment -> cancelled
```

`final_delivered` ne signifie pas que le fichier est servi : le contrôleur doit refaire le contrôle de statut dans la même transaction que la génération de l'URL signée.

## Adaptateur de paiement

Créer `PaymentProvider` avec `WaveProvider`, `OrangeMoneyProvider` et `YasProvider` derrière la même interface :

```php
interface PaymentProvider {
    public function initiateCollection(Order $order, string $payerPhone): CollectionResult;
    public function initiatePayout(User $provider, int $amountXof): PayoutResult;
    public function normalizeWebhook(array $payload, string $signature): PaymentEvent;
    public function verifyTransactionStatus(string $reference): ProviderStatus;
}
```

Les noms d'API, signatures, limites et capacités de payout doivent être validés dans la documentation officielle de chaque fournisseur avant production. Tant qu'un payout API n'est pas disponible, le retrait reste `pending_manual_review` et ne crédite jamais automatiquement un téléphone non vérifié.

## Anti-contournement

Avant insertion d'un message, scanner le contenu pour téléphones sénégalais/internationaux, `WhatsApp`, `Wave`, `Orange Money`, `OM`, `appelle-moi` et URLs non whitelistées. Masquer la portion détectée, afficher un avertissement, puis créer un `risk_event`. La répétition déclenche une limitation et une revue admin, pas un bannissement automatique au premier signal.

## Jobs requis

- `ReleaseExpiredOrders`: libère les commandes après le délai de contestation.
- `ProcessPaymentEvents`: valide signatures, idempotence et transitions.
- `GenerateWatermarkedPreview`: produit l'aperçu avant exposition.
- `RecalculateSamaScore`: agrège commandes libérées, délais, avis, annulations et litiges.
- `DetectReviewClusters`: signale les schémas d'avis suspects.
- `FlagUnusualLogin`: notifie les nouveaux appareils ou localisations.

## Tests minimums avant production

- Webhook invalide, dupliqué, rejoué et montant différent.
- Livraison finale avant paiement, après paiement et après litige.
- Double clic validation et double exécution du job d'expiration.
- Remboursement client et libération prestataire, jamais les deux.
- Avis avant et après `completed_released`.
- Numéro de téléphone dans un message, lien whitelisté et lien externe.
- Payout bloqué quand le téléphone ne correspond pas à l'identité vérifiée.
