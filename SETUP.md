# Narration Agent (Nandatha) - Vercel setup

Files: index.html, api/*.js, lib/*.js, package.json, vercel.json  (push all to GitHub, import in Vercel, Framework = Other)

## Environment Variables (Vercel > Project > Settings > Environment Variables)
| Name | Value |
|---|---|
| APP_USER | login username (e.g. nandatha) |
| APP_PASS | login password (long, not shared elsewhere) |
| SESSION_SECRET | any long random text (optional but better) |
| GEMINI_API_KEY | free key from aistudio.google.com (optional) |
| GEMINI_MODEL | optional, default gemini-2.5-flash |
| ANTHROPIC_API_KEY | Claude key from console.anthropic.com (optional) |
| CLAUDE_MODEL | optional, default claude-sonnet-4-5 |
| MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT | Outlook (see below), optional |

At least one of GEMINI_API_KEY / ANTHROPIC_API_KEY is needed. If both are set, a dropdown at the top lets the user choose.
After adding or changing variables: Deployments > ... > Redeploy.

## Outlook (payment mails) - Azure setup, one time
1. portal.azure.com > Microsoft Entra ID > App registrations > New registration. Name: Narration Agent. Accounts: this organizational directory only.
2. Redirect URI (Web): https://YOUR-APP.vercel.app/api/ms/callback
3. API permissions > Add > Microsoft Graph > Delegated: Mail.Read, Mail.Read.Shared, User.Read, offline_access. Grant admin consent if asked.
4. Certificates & secrets > New client secret > copy the Value.
5. Overview page: copy Application (client) ID and Directory (tenant) ID.
6. In Vercel add MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT (the tenant ID). Redeploy.
7. Open the app > Connect Outlook > sign in with the mailbox that can read jeeva@poornatha.com.

## Notes
- The Tally snapshot (.tdsnap) stays in each browser. Load it once per browser in the Tally data bar.
- Live Tally fetch works only inside Claude desktop; the web version uses the snapshot.
- Bill photos: keep a request under about 4 MB in total (Vercel limit).
