# TODO — BezotCorp Studio

## Proxy Rust

- Créer `llm-proxy/` en Rust.
- Servir de couche de compatibilité entre Agent Studio et les backends LLM.
- Gérer les capabilities par backend/modèle :
  - tools
  - tool choice
  - thinking/reasoning
  - streaming
  - autres options sensibles
- Désactiver proprement les options non supportées avant qu’elles provoquent un crash.
- Ne pas masquer les vraies erreurs.
- Logger les capacités détectées et les options désactivées.
- Préparer le futur bypass progressif du système OpenHands.
- Garder Agent Studio indépendant du backend réel.

## Développement

- Supporter npm et pnpm.
- Tendre vers le support d’autres package managers si ça reste propre, notamment Yarn.
- Permettre aux développeurs de lancer le projet avec leur gestionnaire habituel.
- Vérifier les scripts install/dev/test/build avec npm et pnpm.
- Documenter les commandes équivalentes pour chaque gestionnaire supporté.

## Modernisation

- Étudier les warnings React Router v8.
- Corriger les warnings i18next.
- Corriger les warnings Vitest.

## Architecture

- Garder `agent-studio/` dédié à l’UI.
- Ajouter `llm-proxy/` comme composant indépendant.
- Préserver une séparation claire entre UI, proxy, runtime, orchestration et configuration.
