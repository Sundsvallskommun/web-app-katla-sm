# Security dependency constraints

The frontend stays on Next.js 16.2.11 while the application supports RHEL 8.10
(glibc 2.28). The native SWC packages in Next.js 16.3.0 and 16.3.4 require
glibc 2.29, so the existing Turbopack build cannot run on RHEL 8.10.

Next.js 16.2.11 contains the fixes for the open Next.js security advisories, but
still requests vulnerable PostCSS 8.4.31 and sharp 0.34.x. The frontend manifest
therefore owns two scoped Yarn resolutions:

- `next/postcss`: use patched PostCSS 8.5.26 or later in the 8.x line.
- `next/sharp`: use patched sharp 0.35.4 or later in the 0.35.x line, shared with
  the existing direct sharp dependency.

Remove these resolutions when a Next.js release declares safe versions of both
packages and passes the RHEL 8.10 build and frontend browser tests. Validate
native image encoding and the standalone server's image endpoint when changing
the sharp constraint. Avoid broad overrides of unrelated dependency trees.

The existing standalone tracer omits libvips shared libraries. The scoped
`outputFileTracingIncludes` entry in `frontend/next.config.js` includes those
assets, and the RHEL workflow loads sharp from the standalone output in a fresh
process and checks AVIF/WebP encoding. Remove the include when an upstream Next.js
tracer packages the libraries automatically and that check still passes.

The frontend also carries a `patch-package` patch for
`@sk-web-gui/toasted-notes@1.2.2`. Its import-time React root is created before
Next.js hydrates the document, preventing React from installing document-level
click listeners on newer Next.js versions. The patch keeps root creation inside
the existing Toaster owner and delays it until the first notification. It mounts
the manager synchronously so that first notification is delivered too. Both
published module formats are patched by the project's `postinstall` command.
CI and Docker install dependencies with `--ignore-scripts` and then explicitly
run `yarn run postinstall`, so only this reviewed patch step executes. The overview
browser tests cover click handling; the message-send test
covers the first confirmation toast. Remove this patch and its install tooling
when an upstream release initializes the toast root lazily and those tests pass.

Dependency lifecycle scripts remain disabled in CI and Docker. The supported
platforms use the native binaries supplied as optional packages; build and browser
tests verify these work without install-time fallback downloads. If a future
dependency needs an installation step, review that specific step and invoke it
explicitly rather than enabling all dependency scripts. Local `yarn install`
retains its normal lifecycle behavior. To reproduce the CI installation locally,
use `yarn install --frozen-lockfile --ignore-scripts` in each package and then
`yarn run postinstall` in the frontend.

The remaining Quill 2.0.3 advisory, GHSA-v3m3-f69x-jf25, has no published patched
version as of 2026-09-04. It requires a separate review of the editor's HTML
handling or an upstream fix; these dependency updates do not dismiss it.
