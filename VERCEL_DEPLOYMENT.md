# Paisa Vercel deployment

This package contains the complete source for the Paisa mobile-first PWA. It does not require API keys or server-side environment variables.

## Deploy from another device

1. Extract the ZIP into a new folder.
2. Install Node.js 24.
3. Open a terminal in the extracted folder.
4. Run the local verification:

```powershell
npm ci
npm run check
```

5. Sign in and deploy with the Vercel CLI:

```powershell
npx vercel@latest login
npx vercel@latest --prod
```

The included `vercel.json` selects Vite, runs `npm ci` and `npm run build`, publishes `dist`, preserves SPA deep links, applies long-lived caching only to hashed assets, and forces the service worker to revalidate.

Alternatively, place the extracted source in a Bitbucket repository and import that repository in the Vercel dashboard. Keep the project root at the folder containing `package.json`; the remaining build settings come from `vercel.json`.

## Production checks

After deployment:

1. Open the production URL on a phone.
2. Visit Overview, Transactions, Money Plan, Workspace, Insights, and Settings.
3. Add a small test transaction and refresh the page to verify local persistence.
4. Open Settings and install Paisa, or use the browser's Add to Home Screen action.
5. Turn on airplane mode after the first successful load and reopen the installed app to verify offline startup.
6. Export a JSON backup before entering important data.

## Important data behavior

Paisa is intentionally local-first. Transactions, plans, and Workspace pages are stored in IndexedDB inside each browser profile. Deploying to Vercel does not create a cloud database and does not synchronize data between phones or computers. Use Settings → Download backup and Restore backup when moving records between devices.
