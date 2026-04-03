## Summary

<!-- What does this PR do? One or two sentences. -->

## Changes

-
-

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Docs / config

## Target Branch

- [ ] `develop` — staging (normal flow for all features & fixes)
- [ ] `main` — production (only from `develop` after staging sign-off)

## Staging Test Checklist

> Complete on the staging URL before requesting review.

- [ ] Home page loads correctly
- [ ] Products catalog and search work
- [ ] Cart add / remove / update quantity
- [ ] Checkout flow (address → payment → confirm) with **Razorpay test card**
- [ ] Login / Register
- [ ] Admin panel accessible and functional
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No lint errors (`npm run lint`)
- [ ] CI checks pass (lint, type-check, build)

## Razorpay Test Cards (staging only)

| Card | Number | CVV | Expiry |
|------|--------|-----|--------|
| Success | 4111 1111 1111 1111 | Any | Any future |
| Failure | 4000 0000 0000 0002 | Any | Any future |

## Screenshots (if UI change)

<!-- Paste before/after screenshots here -->

## Related Issues

Closes #
