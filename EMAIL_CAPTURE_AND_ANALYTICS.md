# Système de Capture d'Emails et Analytics GA4

## Vue d'ensemble

Ce document décrit le système complet de capture d'emails et de tracking Google Analytics 4 (GA4) mis en place pour maximiser la conversion et analyser le funnel utilisateur.

## 🎯 Objectifs accomplis

### Objectif 1 : Capture automatique de TOUS les emails
✅ Tous les emails saisis sont capturés **immédiatement** en base de données
✅ Fonctionne sur **mobile ET desktop**
✅ Capture même si l'utilisateur **n'achève pas le formulaire**
✅ Pas de doublons (email unique + déduplication temporelle)

### Objectif 2 : Événements Google Analytics 4
✅ `email_entered` - dès qu'un email valide est saisi
✅ `quittance_generated` - à la génération du PDF
✅ `pdf_downloaded` - lors du téléchargement
✅ `free_account_created` - création de compte gratuit
✅ `cta_automation_clicked` - clic sur CTAs vers automation

Chaque événement inclut :
- `device` (mobile/desktop)
- `page_source` (home/generator/irl_resultat/automation)
- Métadonnées contextuelles

---

## 🏗️ Architecture

### 1. Base de données : Table `email_captures`

**Colonnes principales :**
- `email` (text) - Email capturé
- `page_source` (text) - Page d'origine (home, generator, irl_resultat, automation)
- `form_type` (text) - Type de formulaire (quittance_generation, revision_letter, notify_me, etc.)
- `device_type` (text) - mobile ou desktop
- `form_completed` (boolean) - Si le formulaire a été complété
- `converted` (boolean) - Si le lead a converti
- `proprietaire_id` (uuid, nullable) - Lien vers compte proprietaire existant
- `metadata` (jsonb) - Métadonnées supplémentaires

**Avantages :**
- Permet d'analyser le funnel complet
- Différencie les nouveaux prospects des clients existants
- Tracking de la conversion de bout en bout
- Évite les doublons grâce à la déduplication temporelle (5 minutes)

### 2. Service Analytics : `src/utils/analytics.ts`

Fonctions principales :

#### Capture d'emails
```typescript
captureEmail(email, pageSource, formType, metadata?)
```
- Valide le format email
- Vérifie les doublons récents (5 min)
- Insère en base de données
- Track l'événement GA4 `email_entered`

#### Événements GA4
```typescript
trackGA4Event(eventName, params)
trackQuittanceGenerated(pageSource, metadata)
trackPdfDownload(pageSource, pdfType)
trackFreeAccountCreated(pageSource)
trackCtaClick(ctaName, pageSource, destination)
```

#### Helpers
```typescript
getDeviceType() // 'mobile' | 'desktop'
markFormCompleted(captureId)
linkEmailToProprietaire(email, proprietaireId)
```

### 3. Hook React : `src/hooks/useEmailCapture.ts`

Hook personnalisé pour faciliter l'intégration dans les composants :

```typescript
const { handleEmailChange, captureId, markComplete } = useEmailCapture({
  pageSource: 'home',
  formType: 'quittance_generation'
});

// Utilisation
<input
  type="email"
  onChange={(e) => handleEmailChange(e.target.value)}
/>
```

**Fonctionnalités :**
- Debounce automatique (800ms par défaut)
- Évite les captures multiples du même email
- Retourne l'ID de capture pour suivi ultérieur

---

## 📍 Pages et Formulaires Implémentés

### Page Home (`/`)
**Formulaires :**
- Générateur de quittance rapide
- Champ : `baillorEmail`

**Événements trackés :**
- ✅ Email capturé dès saisie valide
- ✅ `quittance_generated` après envoi réussi
- ✅ `pdf_downloaded` si téléchargement PDF
- ✅ `cta_automation_clicked` sur 3 CTAs vers /automation

### Page Generator (`/generator`)
**Formulaires :**
- Générateur de quittance complet
- Champ : `baillorEmail`

**Événements trackés :**
- ✅ Email capturé dès saisie valide
- ✅ `quittance_generated` après envoi réussi
- ✅ `pdf_downloaded`

### Page IRL Resultat (`/irl/resultat`)
**Formulaires :**
1. PDFEmailModal - Envoi de la lettre de révision
   - Champs : `email`, `baillorName`, `baillorAddress`, `locataireName`, etc.
2. Modal de rappel
   - Champ : `reminderEmail`

**Événements trackés :**
- ✅ Email capturé dans les 2 formulaires
- ✅ `pdf_downloaded` après génération lettre révision

### Page Automation (`/automation`)
**Formulaires :**
- NotifyMeModal - "Me tenir informé"
- Champ : `email`

**Événements trackés :**
- ✅ Email capturé avec lien vers compte proprietaire si existant
- ✅ Tracking du produit d'intérêt (quittance_connectee_plus)

---

## 📊 Analytics Google Analytics 4

### Configuration

Le site utilise déjà Google Tag Manager (GTM) et gtag.js configurés dans `index.html` :

```html
<!-- Google Tag Manager -->
<script>(...GTM script...)</script>

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17881219498"></script>
```

Notre système utilise `window.gtag()` qui est déjà initialisé.

### Événements disponibles dans GA4

| Événement | Trigger | Paramètres |
|-----------|---------|------------|
| `email_entered` | Email valide saisi | device, page_source, form_type |
| `quittance_generated` | PDF généré | device, page_source, is_prorata, loyer |
| `pdf_downloaded` | PDF téléchargé | device, page_source, pdf_type |
| `free_account_created` | Compte créé | device, page_source |
| `cta_automation_clicked` | Clic CTA | device, page_source, cta_name, destination |

### Visualisation du Funnel dans GA4

Pour créer un funnel dans GA4 :

1. **Exploration** > **Funnel exploration**
2. **Étapes du funnel :**
   - Étape 1 : `email_entered`
   - Étape 2 : `quittance_generated` OU `pdf_downloaded`
   - Étape 3 : `free_account_created`
   - Étape 4 : Conversion (signup payant)

3. **Segments :**
   - Par `device` (mobile vs desktop)
   - Par `page_source` (home vs generator vs irl_resultat)

---

## 🔍 Requêtes SQL Utiles

### Voir tous les emails capturés aujourd'hui
```sql
SELECT
  email,
  page_source,
  form_type,
  device_type,
  form_completed,
  created_at
FROM email_captures
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Taux de complétion par page
```sql
SELECT
  page_source,
  COUNT(*) as total_captures,
  SUM(CASE WHEN form_completed THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN form_completed THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate_pct
FROM email_captures
GROUP BY page_source
ORDER BY total_captures DESC;
```

### Leads nouveaux vs clients existants
```sql
SELECT
  CASE
    WHEN proprietaire_id IS NOT NULL THEN 'Client existant'
    ELSE 'Nouveau prospect'
  END as type_lead,
  COUNT(*) as count
FROM email_captures
GROUP BY type_lead;
```

### Top 10 des emails les plus actifs (multi-touchpoints)
```sql
SELECT
  email,
  COUNT(*) as touchpoints,
  COUNT(DISTINCT page_source) as pages_visited,
  MAX(created_at) as last_interaction,
  BOOL_OR(form_completed) as has_completed_form
FROM email_captures
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY touchpoints DESC
LIMIT 10;
```

---

## 🚀 Comment utiliser

### Ajouter la capture d'email à un nouveau formulaire

1. **Importer le hook :**
```typescript
import { useEmailCapture } from '../hooks/useEmailCapture';
```

2. **Initialiser le hook :**
```typescript
const { handleEmailChange, markComplete } = useEmailCapture({
  pageSource: 'ma_page',
  formType: 'mon_formulaire'
});
```

3. **Attacher au champ email :**
```typescript
<input
  type="email"
  onChange={(e) => {
    const value = e.target.value;
    setEmail(value);
    handleEmailChange(value); // Capture automatique
  }}
/>
```

4. **Marquer comme complété (optionnel) :**
```typescript
const handleSubmit = async () => {
  // ... logique de soumission ...
  markComplete(); // Marque la capture comme formulaire complété
};
```

### Ajouter un nouvel événement GA4

```typescript
import { trackGA4Event } from '../utils/analytics';

trackGA4Event('mon_evenement_custom', {
  page_source: 'ma_page',
  custom_param: 'valeur'
});
```

---

## 🔐 Sécurité et Confidentialité

- ✅ RLS activé sur la table `email_captures`
- ✅ Politiques permettant l'insertion anonyme (capture sans authentification)
- ✅ Les emails sont stockés en clair mais la table est protégée par RLS
- ✅ Pas de PII sensible dans les événements GA4 (anonymisation)
- ✅ Conformité RGPD : les utilisateurs peuvent demander suppression

---

## 📈 Métriques Clés à Surveiller

### Dans Supabase (email_captures)
1. **Taux de capture** : Combien d'emails uniques par jour ?
2. **Taux de complétion** : % de captures avec `form_completed = true`
3. **Répartition par source** : Quelle page capture le plus ?
4. **Mobile vs Desktop** : Différence de comportement ?
5. **Conversion** : % de captures avec `converted = true`

### Dans GA4
1. **Funnel email → quittance** : Taux de conversion
2. **Taux d'abandon** : À quelle étape les users partent ?
3. **Device breakdown** : Performance mobile vs desktop
4. **Source traffic** : Quels canaux amènent les meilleurs leads ?

---

## 🐛 Debugging

### L'email n'est pas capturé
1. Vérifier la console : `Email captured: xxx on yyy`
2. Vérifier le format email (regex)
3. Vérifier qu'il n'y a pas eu de capture récente (< 5 min)

### Les événements GA4 ne s'affichent pas
1. Vérifier la console : `GA4 Event tracked: xxx`
2. Attendre 24-48h pour que GA4 affiche les événements
3. Utiliser le DebugView de GA4 en temps réel
4. Vérifier que gtag.js est bien chargé : `window.gtag`

### Erreurs RLS
Les captures doivent fonctionner même sans authentification. Vérifier les policies :
```sql
-- Policy pour insertion anonyme
CREATE POLICY "Anyone can capture emails"
  ON email_captures FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

---

## 📝 Maintenance

### Nettoyage des anciennes captures
```sql
-- Supprimer les captures de plus de 2 ans (RGPD)
DELETE FROM email_captures
WHERE created_at < NOW() - INTERVAL '2 years';
```

### Mise à jour du statut de conversion
```sql
-- Marquer comme converti quand un proprietaire est créé
UPDATE email_captures
SET converted = true, proprietaire_id = 'xxx'
WHERE email = 'user@example.com';
```

---

## ✅ Checklist de déploiement

- [x] Table `email_captures` créée avec RLS
- [x] Service analytics.ts implémenté
- [x] Hook useEmailCapture créé
- [x] Page Home : capture + événements GA4
- [x] Page Generator : capture + événements GA4
- [x] Page IRL Resultat : capture + événements GA4
- [x] Page Automation : NotifyMeModal avec capture
- [x] Google Tag Manager configuré
- [x] Build réussi sans erreurs
- [ ] Tester en staging
- [ ] Vérifier les événements dans GA4 DebugView
- [ ] Documenter les dashboards GA4
