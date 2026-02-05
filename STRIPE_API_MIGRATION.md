# Migration Stripe API - redirectToCheckout() déprécié

## Contexte

Stripe a déprécié la méthode `stripe.redirectToCheckout()` dans les versions récentes de `@stripe/stripe-js`. Cette méthode retournait maintenant l'erreur :

```
stripe.redirectToCheckout is no longer supported in this version of Stripe.js
```

## Changements Appliqués

### 1. QuickPaymentModal.tsx

**Avant :**
```typescript
const { error: stripeError } = await stripe.redirectToCheckout({
  sessionId: data.sessionId,
});
```

**Après :**
```typescript
if (data.url) {
  window.location.href = data.url;
} else {
  throw new Error('URL de paiement manquante');
}
```

### 2. RegisteredMailModal.tsx

**Avant :**
```typescript
const { sessionId } = await response.json();
const stripe = await stripePromise;

if (!stripe) {
  throw new Error('Stripe n\'a pas pu être chargé');
}

const { error } = await stripe.redirectToCheckout({ sessionId });
```

**Après :**
```typescript
const { url } = await response.json();

if (!url) {
  throw new Error('URL de paiement manquante');
}

window.location.href = url;
```

### 3. Protection contre la clé Stripe manquante

**Avant :**
```typescript
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
```

**Après :**
```typescript
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
```

## Edge Functions

Les edge functions retournent déjà l'URL de checkout :

### quick-checkout (ligne 126)
```typescript
return new Response(
  JSON.stringify({
    sessionId: session.id,
    url: session.url,  // ✅ URL retournée
  }),
  { ... }
);
```

### stripe-checkout (ligne 258)
```typescript
return corsResponse({ sessionId: session.id, url: session.url });  // ✅ URL retournée
```

## Avantages de la Nouvelle API

1. **Plus simple** : Pas besoin de charger Stripe côté client juste pour rediriger
2. **Plus rapide** : Redirection directe sans attendre le SDK Stripe
3. **Moins de code** : Moins de gestion d'erreurs côté client
4. **Compatible** : Fonctionne avec toutes les versions de Stripe

## Variables d'Environnement

### Variable corrigée
- ❌ `VITE_STRIPE_PUBLIC_KEY` (ancienne, incorrecte)
- ✅ `VITE_STRIPE_PUBLISHABLE_KEY` (nouvelle, correcte)

Cette variable doit être ajoutée dans `.env` :

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
```

## Tests Effectués

- ✅ Build réussi sans erreurs
- ✅ QuickPaymentModal : gestion sécurisée de la clé manquante
- ✅ RegisteredMailModal : redirection directe vers Stripe
- ✅ Edge functions : retournent déjà l'URL correctement

## Compatibilité

Cette migration est compatible avec :
- Stripe API version `2024-12-18.acacia` et supérieure
- `@stripe/stripe-js` version 2.x et 3.x
- Tous les navigateurs modernes

## Actions Requises

Pour déployer cette migration :

1. **Ajouter la clé Stripe** dans `.env` :
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Rebuild** :
   ```bash
   npm run build
   ```

3. **Tester le flux de paiement** :
   - QuickPaymentModal (mobile)
   - RegisteredMailModal (courrier recommandé)

## Références

- [Stripe Changelog - Remove redirectToCheckout](https://docs.stripe.com/changelog/clover/2025-09-30/remove-redirect-to-checkout)
- [Stripe Checkout Sessions](https://docs.stripe.com/payments/checkout/how-checkout-works)
- [Migration Guide](https://docs.stripe.com/js/migration)
