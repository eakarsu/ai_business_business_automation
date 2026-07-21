# Environment contract

Always required: `DATABASE_URL`. Local/test authentication additionally requires a random `JWT_SECRET` of at least 32 characters. Production requires `NODE_ENV=production`, `AUTH_MODE=oidc`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, and `OIDC_JWKS_URL`; local login and registration are then disabled. Configure `CLIENT_URL`, `PORT`, and `NEXT_PUBLIC_API_URL` to exact network origins.

`ENABLE_EXPERIMENTAL_ROUTES=true` is allowed only outside production and exposes non-authoritative prototypes. AI provider keys are optional and never required by the authoritative workflow. `ALLOW_SCHEMA_MIGRATION=1` and `ALLOW_DATABASE_RESTORE=1` are single-operation safety acknowledgements, not persistent settings. Store all credentials in a secret manager.

For a new production tenant, run `scripts/bootstrap-owner.cjs` once with `ALLOW_IDENTITY_BOOTSTRAP=1`, `TENANT_NAME`, `OWNER_EMAIL`, `OWNER_NAME`, and the verified `OIDC_SUBJECT`. Remove the acknowledgement immediately afterward.
