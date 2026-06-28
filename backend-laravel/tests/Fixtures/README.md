# Test fixtures — Firebase JWT signing

These PEM files are **throwaway test keys** used only by the unit tests for
`FirebaseTokenVerifier` and `AutenticacionService`. They must NEVER be used
for production traffic.

## Files

- `firebase-test-private.pem` — trusted private key. Signs the valid tokens
  in the tests.
- `firebase-test-public.pem` — trusted public key. Returned by the mocked
  Firebase certificates endpoint.
- `firebase-test-other-private.pem` — second private key, used to simulate
  a token signed by an unknown party.
- `firebase-test-other-public.pem` — matching public key, unused by tests
  but kept alongside the private key.

## Regeneration

If these files are missing or you need to rotate them:

```sh
openssl genrsa -out firebase-test-private.pem 2048
openssl rsa -in firebase-test-private.pem -pubout -out firebase-test-public.pem
openssl genrsa -out firebase-test-other-private.pem 2048
openssl rsa -in firebase-test-other-private.pem -pubout -out firebase-test-other-public.pem
```

After regenerating, run `php artisan test --filter=FirebaseTokenVerifierTest`
to confirm the new keys still work end-to-end.