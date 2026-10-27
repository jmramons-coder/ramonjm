# Case-management project access

The portfolio tile opens a persistent iframe at `/case-workspace`. The server
renders the access form until a valid signed session cookie is present. The
public tile and locked page contain an anonymous, blurred layout rather than
case records. The interactive prototype is loaded after access is granted.

Configure these server-only environment variables in `.env.local` for local
development and as Production Secrets on Vercel:

- `CASE_STUDY_ACCESS_CODE`: the shared project code.
- `CASE_STUDY_SESSION_SECRET`: a separate randomly generated signing secret.

Neither value has a source-code default. Missing configuration keeps the page
locked. Codes are case-insensitive and ignore surrounding whitespace. Access
lasts eight hours, using an HttpOnly, SameSite=Lax cookie scoped to
`/case-workspace`, with Secure enabled in production. Rotate the signing secret
to revoke existing sessions.

The prototype's client-side fixtures must remain fictional. The code gate
controls the project entry point; it is not storage for confidential records.

Run the access checks with:

```sh
node --test scripts/case-study-access.test.mjs
```
