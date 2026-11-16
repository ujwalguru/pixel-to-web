<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The kiosk welcome screen lives at `/` (src/routes/index.tsx); reusable kiosk pieces go in src/components/kiosk/. Why: keeps the single-screen kiosk easy to find.
- Neon/glass visual styles are defined as component classes in src/styles.css (glass-card, seg-tab, btn-start, etc.), never ad hoc colors in components. Why: one place to tune the theme.
- Kiosk backend logic lives in src/lib/kiosk.functions.ts as public server functions using the admin client inside handlers; kiosk tables have RLS on with no browser policies. Why: the PC screen has no sign-in, so all access goes through validated server code.
- Shared kiosk rules (durations, PC id, formatting) live in browser-safe src/lib/kiosk.ts with tests in src/lib/kiosk.test.ts. Why: one source for screen, phone page and server.
- The kiosk screen renders a fixed 1600x900 canvas scaled to the window via KioskStage. Why: pixel-identical layout on any display with no scrolling.
- Per-PC settings (terminal name, launcher closed) live in that machine's localStorage; the staff PIN is a single hashed row checked only by server functions. Why: each kiosk is its own device, while the PIN must never reach the browser.
