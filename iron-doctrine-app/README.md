# Iron Doctrine — Member Portal

Your branded client portal. It reads live from your Notion workspace, so when you edit a
client's training or food in Notion, their page updates on its own — no publishing, no
re-uploading.

You'll set this up in **three phases**. After Phase 1 you already have a live website.

---

## Phase 1 — Get it live (10 minutes, no Notion needed yet)

The app works out of the box with demo data, so let's get a real URL first.

1. **Make a free GitHub account** at github.com (if you don't have one).
2. **Create a new repository** (the green "New" button). Name it `iron-doctrine-portal`. Click "Create".
3. **Upload these files**: on the new repo page, click *"uploading an existing file"*, then drag in
   everything from this folder **except** the `node_modules` and `.next` folders if present. Commit.
4. **Go to vercel.com**, click "Sign Up", and choose **Continue with GitHub**.
5. Click **Add New… → Project**, find your `iron-doctrine-portal` repo, and click **Import**, then **Deploy**.
6. Wait ~1 minute. Vercel gives you a live URL like `https://iron-doctrine-portal.vercel.app`.
7. Visit **`your-url/c/demo`** — you'll see the portal running on demo data. 🎉 You just hosted a website.

---

## Phase 2 — Connect your Notion (show real client data)

1. **Create a Notion integration:** go to **notion.com/my-integrations → New integration**.
   Name it "Iron Doctrine Portal", pick your workspace, create it, and **copy the secret**
   (starts with `ntn_` or `secret_`).
2. **Give it access to your data:** open your **Iron Doctrine — Coaching HQ** page in Notion →
   top-right **•••** → **Connections → Connect to → Iron Doctrine Portal**. (Connecting the HQ page
   shares everything under it.) If any database still shows no data, open that database and add the
   connection there too.
3. **Add your keys to Vercel:** in Vercel → your project → **Settings → Environment Variables**, add:
   - `NOTION_TOKEN` = the secret you copied
   - `FORM_SESSION` = your "Log Today's Session" form link
   - `FORM_CHECKIN` = your "Client Check-in" form link
4. **Redeploy:** Vercel → **Deployments → ••• → Redeploy**.
5. **Each client's personal link** is `your-url/c/THEIR-PAGE-ID`. To get a client's page ID:
   open them in Notion → **•••** → **Copy link** → the long string at the end of that link is the ID.
   - Example — Petra's real link would be:
     `your-url/c/3871a67a924d81b6a5f1dfabca689c5f`
6. Open a client's link — you should see their real program, macros, supplements, and weight chart.
   Edit something in Notion, refresh the page, and watch it change. That's the magic.

> First time connecting real data? If a section looks empty or odd, tell Claude exactly what you see —
> the data-reading code may need one small tweak for your workspace, and that's a quick fix.

---

## Phase 3 — Add real logins (later, optional)

Right now each client opens their own **unguessable link** — practically private, and zero setup.
When you're ready for proper "sign in with your email" logins (so links can't be shared), that's an
auth layer we add on top. Ask Claude when you want it.

---

## Optional — your own domain

In Vercel → **Settings → Domains**, add `irondoctrine.cz` (buy it from any registrar for ~$12/year)
and follow Vercel's on-screen DNS steps. Then clients visit `irondoctrine.cz/c/...`.

---

## Running it on your own computer (optional)

```
npm install
npm run dev
```
Then open `http://localhost:3000/c/demo`.
