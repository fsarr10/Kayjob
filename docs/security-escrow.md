# KayJob - confiance, séquestre et paiements

Cette spécification accompagne `database/migrations/002_trust_escrow.sql`. Le dépôt ne contient pas encore l'API Laravel : la migration prépare Neon et le contrat ci-dessous doit être appliqué dans les contrôleurs, services et jobs Laravel.

## Règles non négociables

- Une commande ne passe à `escrowed` qu'après un webhook fournisseur authentifié, vérifié et traité une seule fois.
- `POST /orders/{id}/deliver-final` recharge la commande en base dans une transaction et refuse toute commande qui n'est pas payée et bloquée.
- Les fichiers originaux sont privés. Une URL signée courte est générée à la demande, jamais enregistrée comme lien public.
- Un aperçu image/vidéo est filigrané côté serveur. Les textes sont tronqués et le code est exposé sous forme de démo ou capture avant paiement.
- Le prestataire n'est crédité que par une écriture `release` dans `transactions` au passage à `completed_released`.
- Sur mobile, `apps/mobile/src/SecurePreview.tsx` active la protection de capture Expo pendant la vue sensible et journalise les captures détectées via callback. Le composant est volontairement un shell : le flux chunké réel doit être servi par l'API `preview-stream` et ne doit jamais devenir une URL de fichier publique.
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

## Visionneuse sécurisée

`POST /orders/{id}/deliver-preview` crée un `delivery_file` et, pour une image/vidéo, une session `preview_sessions` de 15 minutes. Le client reçoit le token brut une seule fois. `GET /orders/{id}/preview-stream?token=...` vérifie le hash du token, le viewer autorisé, l'expiration, le statut de la commande et le débit avant de servir des chunks. Chaque capture ou tentative suspecte est enregistrée dans `preview_security_events`.

## Cloudflare R2

Le bucket R2 doit rester privé et être accessible uniquement par une clé API R2 limitée à ce bucket. L'API utilise l'endpoint S3 `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, `region: auto` et les packages AWS SDK S3. Les uploads passent par une URL PUT signée avec le `Content-Type` inclus dans la signature ; les fichiers finaux utilisent une URL GET signée de courte durée. Les previews sont proxifiées par l'API avec `Range` et `Cache-Control: no-store`, afin de ne pas exposer une URL R2 directe.

La protection native est une défense en profondeur : Android bénéficie de `FLAG_SECURE` via Expo Screen Capture, tandis que les appareils iOS peuvent empêcher ou signaler certaines captures selon la version et le type de capture. Aucun navigateur ou appareil externe ne peut être garanti inviolable ; le filigrane dynamique et la traçabilité restent obligatoires.

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
