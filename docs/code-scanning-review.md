# Code scanning review

Reviewed the 14 open GitHub alerts on 2026-09-04 against main commit
`ff7830397751c67df3c07e1e7527f5f24d4dbc30`. Thirteen are from SonarCloud and
one is from CodeQL. Alert numbers below refer to
<https://github.com/Sundsvallskommun/web-app-katla-sm/security/code-scanning>.

| Alerts | Disposition and owner |
| --- | --- |
| #32 | Intentionally retain the example SAML private key and matching self-signed localhost certificate in `backend/.env.example.local`, as confirmed by the maintainer. An inline comment and the README identify the pair as local development test data, not a deployment secret. Real IdP connections use their own key pairs. Classify this alert as used in tests. |
| #33 | The scanner calls this an Alibaba credential, but it is the example `SECRET_KEY` used by Express sessions. Remove the shared value, document local generation and validate the session secret in the existing backend environment validator. Check environments for reuse rather than treating the misclassification as proof of safety. |
| #34 | The RHEL workflow restricts both the initial Node download and redirects to HTTPS. |
| #35 | Installing the pinned Yarn release in the RHEL workflow disables npm lifecycle scripts. |
| #36, #37, #39, #40, #41, #42 | CI and both Dockerfiles disable dependency lifecycle scripts. The frontend then explicitly invokes its existing, reviewed `postinstall` patch command. No general acceptance of dependency installation scripts is needed. See [dependency constraints](dependency-security.md) for the owner and upgrade policy. |
| #43, #44 | Both OpenSSL installations in the backend Dockerfile disable recommended packages. Package-index updates and installation share a layer; the index is removed afterwards. |
| #38 | False positive: `yarn playwright install --with-deps chromium` runs the pinned, already installed Playwright CLI to install its browser and OS dependencies. It does not install JavaScript dependencies or run their lifecycle scripts. Keep the command and dismiss this alert with that specific explanation. |
| #31 | Keep open until a deployment check confirms `Secure` on the real session cookie. The current App integration tests cover trusted forwarded HTTPS, rejection of cookies over plain HTTP in production, and the intentional `ENVIRONMENT=LOCAL` exception. They do not establish the deployed environment or proxy configuration. |

## Deployment checks

Before deploying, supply a separately generated `SECRET_KEY` of at least 32
characters; `openssl rand -hex 32` supplies 32 random bytes. The old 30-character
example and empty/placeholder values are rejected by backend startup validation.
Changing a deployed session secret invalidates existing sessions. Keep real
credentials in the deployment's secret configuration, outside the repository.

For #31, confirm `NODE_ENV=production`, `ENVIRONMENT` is not `LOCAL`, and an actual
login response through the deployed proxy sets `Secure` on the session cookie.
The proxy must supply the correct HTTPS forwarding information for the trusted
hop. If these checks pass, dismiss the finding with the deployment and date of
verification; otherwise fix the deployment configuration and repeat the check.

The code changes must be merged and rescanned before the corresponding alerts
on the default branch can be considered fixed. Do not dismiss those alerts as
false positives to substitute for the rescan or for credential rotation.
