# CrimeSight AI — Zoho QuickML conversation setup

CrimeSight deliberately keeps two separate paths:

- **Verified FIR questions** run locally against the reproducible synthetic dataset and show a proof card.
- **Normal conversation** may use Zoho Catalyst QuickML through a private Catalyst Function. No QuickML secret is ever placed in the browser or Slate environment.

## 1. Create the QuickML model endpoint

In Catalyst, open **QuickML → Generative AI → LLM Serving**, choose an instruction model, and create a deployment. In its **API Details** page, copy the endpoint URL and the required authentication/header format.

Create the OAuth token with the scope shown in that API Details page. Keep the token private; do not paste it into this repository, a browser variable, or chat.

## 2. Deploy the private adapter

Deploy the `quickml-conversation` Advanced I/O function. In the function's environment variables, set:

| Key | Value |
| --- | --- |
| `QUICKML_ENDPOINT` | The endpoint copied from QuickML API Details |
| `QUICKML_AUTH_HEADER_NAME` | Usually `Authorization` — use the API Details value |
| `QUICKML_AUTH_HEADER_VALUE` | The full OAuth header value from API Details |
| `QUICKML_ORG_HEADER_NAME` | The organisation header name from API Details, if required |
| `QUICKML_ORG_HEADER_VALUE` | The organisation header value, if required |
| `ALLOWED_ORIGINS` | `https://crimesight-dep-onmoxbpk.onslate.in` |

Then add an API Gateway route for the newly deployed function, for example `/quickml-conversation`. The route must allow `POST` and `OPTIONS`.

The function sends an OpenAI-style `messages` payload. If your QuickML API Details page specifies a different request body or response envelope, update `functions/quickml-conversation/index.js` to match that published contract before deploying.

## 3. Connect Slate without secrets

In Slate app settings, create exactly one public environment variable:

```text
NEXT_PUBLIC_QUICKML_CHAT_URL=https://<your-catalyst-function-domain>/quickml-conversation
```

Redeploy or sync Slate. The interface will show **“QuickML conversation + verified FIR queries”** when this URL is present. If QuickML is unavailable, it still gives a polished guided response and all FIR queries remain available with their proof cards.

## Verification

1. Ask `hi` — response should come from QuickML and should not display a FIR proof card.
2. Ask `What can you do?` — it should explain capabilities without claiming live police data.
3. Ask `Show high-risk cybercrime FIRs in Mysuru` — it must still show the deterministic verified-query proof card.

This separation is intentional: a generative model is used only for conversation, not as the source of FIR results or enforcement recommendations.
