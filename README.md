# SupaWalletID

**Seamlessly link wallet identities to Supabase Auth for mini-app ecosystems
like [World App](https://worldcoin.org/world-app) and beyond.**

SupaWalletID is a TypeScript helper library for developers building **mini
apps** or web apps that require **wallet-based user authentication**—with **zero
manual auth flow coding**.

Currently, it integrates **Supabase** (as the backend identity store) with
**Ethereum-compatible wallet logins** from ecosystems like **World App**.\
It can easily be extended to work with other crypto super-app platforms such as
**Base**.

---

## 💡 Background

Modern crypto-enabled apps often authenticate users via their **wallet address**
(e.g., Ethereum).\
Platforms like **World App** provide identity-verification flows so users can
sign in with their wallet, but:

- The authentication happens _inside_ the platform's ecosystem.
- Your backend still needs to **link that wallet identity** to your own user
  database.
- If you’re using Supabase Auth, you’d typically have to build and maintain your
  own wallet-to-Supabase integration.

Without a proper integration layer, developers must handle:

- Creating Supabase users after wallet sign-in
- Ensuring the same wallet always maps to the same Supabase user
- Maintaining the Supabase session state
- Handling sign-up / sign-in logic manually

---

## 🎯 Use Case

You’re building a **World App mini app** with **Supabase** as your backend.\
You want your users to:

1. Open your app inside World App
2. Sign in once with their wallet
3. Automatically have a **Supabase session** created and maintained
4. Access Supabase data without ever touching an email/password form

**SupaWalletID** makes this happen automatically.

---

## ⚙️ How It Works

SupaWalletID provides both **client-side** and **server-side** helpers:

### **Client-side**

- **`<SupaWalletUserProvider>`**\
  A React provider component that:
  - Keeps track of the current Supabase session
  - Automatically authenticates via the user’s wallet if needed
  - Ensures a 1:1 link between the wallet address and the Supabase user

- **`useSupaWalletUser()`**\
  A React hook that returns the current Supabase user object:
  ```ts
  const { supaUser } = useSupaWalletUser();
  ```
  Useful for gated content, profile views, and personalized UI.

- **`<SampleSupaWalletText>`** A demo component showing the logged-in user’s
  information (great for testing).

---

### **Server-side (Next.js)**

- **`signInWalletPostHandler`**\
  An API route handler that:
  - Verifies wallet-signature data submitted from the client
  - Creates or updates the corresponding Supabase user
  - Returns a valid Supabase session

- **`updateSessionMiddleware`**\
  A Next.js middleware to:
  - Keep the Supabase session up to date
  - Ensure authenticated API requests automatically recognize the user

---

### User Metadata

When SupaWalletID links a wallet to a Supabase user, the Supabase
`user_metadata` will include additional fields retrieved from the World
ecosystem. This allows your app to access relevant wallet and profile
information directly from the Supabase user object.

The structure of the `user_metadata` will look like:

```json
{
  "address": "...",
  "worldUsername": "...",
  "worldProfilePictureUrl": "..."
}
```

- `address`: The user's wallet address.
- `worldUsername`: The username associated with the user's World account.
- `worldProfilePictureUrl`: The URL of the user's profile picture from World.

---

## 🚀 Quick Example

Here’s the smallest possible example of using **SupaWalletID** in a React app:

```tsx
import { SampleSupaWalletText, SupaWalletUserProvider } from "supawalletid";

export default function App() {
  return (
    <SupaWalletUserProvider
      loadingChildren={<div>Loading your wallet session...</div>}
    >
      <div>
        <SampleSupaWalletText />
      </div>
    </SupaWalletUserProvider>
  );
}
```

- loadingChildren is shown while wallet verification is in progress.
- Once the session is established, your personalized content is rendered with
  full access to Supabase Auth.

## 📦 Installation

```bash
npm install supawalletid
# or
yarn add supawalletid
# or
pnpm add supawalletid
```

## 🔧 Setup & Integration

Below are the concrete steps to get **SupaWalletID** running in a Next.js +
Supabase project. Copy these into your README under the existing content.

### 1) Environment variables (`.env.sample`)

Create a `.env.local` (or use your deployment environment settings) with the
following variables. Keep the **service role** key secret — never expose it to
the browser.

```
# Client-side (exposed to the browser)
NEXT_PUBLIC_BASE_URL='https://your-next-js-url'
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

# Server-side (secret, must NOT be exposed)
HMAC_SECRET_KEY='some random key' # create this by running `openssl rand -base64 32`
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: override path if you want to use a different endpoint
# SUPAWALLETID_SIGNIN_PATH=/api/sign-in-with-wallet
```

> Tip: On Vercel/Netlify put NEXT_PUBLIC_ keys in the “Environment Variables”
> panel and the `SUPABASE_SERVICE_ROLE_KEY` into project secrets / server-only
> env variables.

---

### 2) Add the Next.js API route for wallet sign-in

Create an App Router route at `app/api/sign-in-with-wallet/route.ts` (Next 13+).
The file contents should simply re-export the handler from the library:

```typescript
export { signInWalletPostHandler as POST } from "supawalletid";
```

---

### 3) Export the middleware

Create `middleware.ts` at the project root (same location Next expects). Make
sure to add the sign-in path (`api/sign-in-with-wallet`) to the regular
expression that disables specific paths from going through the middlware.

Example:

```typescript
export { updateSessionMiddleware as middleware } from "supawalletid";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - the sign-in endpoint and common static image extensions
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/sign-in-with-wallet|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

Place this file at the root of your repo so Next.js picks it up automatically.

---

### 4) Create the Supabase DB schema & table

Run the following SQL in the Supabase Dashboard SQL editor (or via migrations).
This creates the `supa_wallet_id` schema and a `wallet_user` table which holds
the 1:1 wallet ↔ Supabase user mapping.

```sql
create schema if not exists supa_wallet_id;

create table supa_wallet_id.wallet_user (
  user_id uuid not null,
  created_at timestamp with time zone not null default now(),
  wallet character varying not null,
  constraint wallet_user_pkey primary key (wallet),
  constraint wallet_user_user_id_key unique (user_id),
  constraint wallet_user_wallet_key unique (wallet),
  constraint wallet_user_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

GRANT USAGE ON SCHEMA supa_wallet_id TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA supa_wallet_id TO service_role;
```

**Notes**

- The table enforces a 1:1 mapping between wallet and user_id.
- The foreign key references Supabase’s auth.users table; when a user is deleted
  the mapping is cleaned up via ON DELETE CASCADE.

---

### 5) Expose the schema to the Supabase API

On hosted Supabase: 1.	Go to Project → Settings → API. 2.	Under “Database →
Schemas to expose” (or similar), add `supa_wallet_id` to the list of schemas.

If you’re running Supabase locally (via supabase CLI or docker), add the schema
in `config.toml`:

```toml
[api]
# Schemas to expose in your API. Tables, views and stored procedures in this schema will get API
# endpoints. `public` and `graphql_public` schemas are included by default.
schemas = ["public", "graphql_public", "supa_wallet_id"]
```

---

### 6) Migrations / applying the SQL

- **Quick setup (dev/testing):** Use the Supabase SQL Editor in the dashboard
  and paste the SQL snippet from step 4 to create the schema and table
  instantly.
- **Production / version control:** Add the SQL as a migration using the
  Supabase CLI or your preferred migration tool:
  ```bash
  supabase migration new supa_wallet_id_schema
  # paste SQL into generated file
  supabase db push
  ```

This ensures the wallet-user mapping table is tracked and deployed consistently
across environments.

---

### 7) Quick file checklist

Files you must have in your project:

- **app/api/sign-in-with-wallet/route.ts**

```typescript
export { signInWalletPostHandler as POST } from "supawalletid";
```

- **middleware.ts** (at repo root) Should contain:

```typescript
export { updateSessionMiddleware as middleware } from "supawalletid";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/sign-in-with-wallet|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- **.env.local or .env**

```dotenv
HMAC_SECRET_KEY='some random key' # create by running: openssl rand -base64 32
NEXT_PUBLIC_BASE_URL='https://<your nextjs url>'
NEXT_PUBLIC_SUPABASE_URL='https://<your supabase url>'
SUPABASE_SERVICE_ROLE_KEY='<JWT token from supabase>'
NEXT_PUBLIC_SUPABASE_ANON_KEY='<anon JWT token from supabase>'
```

- **Supabase SQL migration**

  Create the `supa_wallet_id` schema and `wallet_user` table using the SQL from
  step 4 above. You can run this in the Supabase SQL Editor or as a migration to
  ensure the necessary tables and permissions are set up for wallet-to-user
  mapping.

---

### 8) Troubleshooting & common gotchas

- **Missing service role key / 403 errors** — ensure `SUPABASE_SERVICE_ROLE_KEY`
  is set in server-only envs. Never expose it to the client.
- **Schema not found** — confirm `supa_wallet_id` is added to the list of
  exposed schemas in Supabase (Settings → API) or in `config.toml` if
  self-hosted.
- **Middleware blocking the sign-in endpoint** — keep `/api/sign-in-with-wallet`
  excluded in the `matcher` config.
- **Signature verification errors** — make sure `HMAC_SECRET_KEY` matches
  between client and server.
- **CORS / network issues** — check that `NEXT_PUBLIC_SUPABASE_URL` is correct
  for your environment.
- **Environment mismatch** — avoid mixing local dev Supabase keys with
  production keys.
