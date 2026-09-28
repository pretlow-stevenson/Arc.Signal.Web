# Copenhagen upstream

- Repository: https://github.com/zendesk/copenhagen_theme
- Release: `v4.51.1` (2026-09-07)
- Commit: `1b9b4ecf72c5f02e45febfdffe68088f5293f94d`
- Import path: `zendesk/theme`
- Method: `git subtree add --prefix=zendesk/theme … v4.51.1 --squash`
- Initial pristine subtree commit: `983693e` (reachable through the import merge).
- License: Apache-2.0; retain `theme/LICENSE` and upstream notices.

The full source, lockfile and release-generated bundles are retained, not just
three copied templates. Git subtree records the upstream merge baseline. No
nested repository or submodule is required after cloning Arc.Signal.Web.

## Update procedure

Review releases monthly; handle relevant security/compatibility fixes promptly.
This is a maintenance recommendation, not an installed scheduler.

1. Start with a clean checkout on a `codex/` maintenance branch. Export the live
   Zendesk theme before an update and keep the current published theme as rollback.
2. Inspect the chosen stable release, its source commit and upstream notices.
3. Fetch and merge the selected tag, replacing `vX.Y.Z` below with the reviewed tag:

   ```sh
   git subtree pull --prefix=zendesk/theme https://github.com/zendesk/copenhagen_theme.git vX.Y.Z --squash
   ```

4. Resolve conflicts using `CUSTOMIZATIONS.md`; retain upstream fixes as well as
   our custom behavior. Do not blindly use ours/theirs or overwrite the theme.
5. Update this file and the manifest as appropriate. Keep the manifest version
   aligned with the Copenhagen source baseline; the Git commit identifies our
   custom revision. Never claim the manifest version alone identifies our patch.
6. Run `node --test zendesk/tests/*.test.mjs`, `npm test`, `npm run guide:check`,
   and `npm run build`. Rebuild upstream bundles with its pinned toolchain only
   if editing upstream JS/SCSS; template-only overrides need no bundle rebuild.
7. Package and import as a non-live theme, verify settings, desktop/mobile, zoom,
   search, article navigation and the request form, then deliberately publish.
8. Record the published theme ID, Git revision and verification in `RELEASE.md`.

Upstream source and Git history are public code, not customer data. Never add
API tokens, browser sessions, support tickets or customer messages here.
