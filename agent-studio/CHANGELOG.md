# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-alpha.2] - 2025-05-11

### Added

- Initial npm package release of `@bezotcorp/agent-studio`
- CLI entry point (`npx @bezotcorp/agent-studio`) to run full stack locally
- Library build mode with component barrel exports
- Subpath exports for modular imports:
  - `@bezotcorp/agent-studio/browser`
  - `@bezotcorp/agent-studio/conversation`
  - `@bezotcorp/agent-studio/files`
  - `@bezotcorp/agent-studio/settings`
  - `@bezotcorp/agent-studio/sidebar`
  - `@bezotcorp/agent-studio/terminal`
  - `@bezotcorp/agent-studio/i18n`
- TypeScript type declarations
- GitHub Actions workflow for automated npm publishing (OIDC trusted publishing)

[Unreleased]: https://github.com/BezotCorp/bezotcorp-studio/compare/v1.0.0-alpha.2...HEAD
[1.0.0-alpha.2]: https://github.com/BezotCorp/bezotcorp-studio/releases/tag/v1.0.0-alpha.2
