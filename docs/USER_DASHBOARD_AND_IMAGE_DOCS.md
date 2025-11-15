# User Dashboard — Clear & Friendly Guide

Last updated: 2025-10-31

This guide explains the recent frontend changes for the User Dashboard (Raise Complaint / My Complaints), why images may not have loaded, and exactly what we changed to fix it. It also includes simple, copy-paste snippets you can use to run, test, and clean up resources.

If you want a one-line summary: the backend serves images from a protected endpoint, so the frontend now fetches protected image blobs with the JWT and uses object URLs to display them safely.

---

## Quick index
- What changed (high level)
- Why images failed to load
- How the frontend fixes it (steps)
- How to run & test locally (copy/paste)
- Memory & performance notes (and a cleanup snippet)
- Next recommendations (what I can do next)

---

## What changed (high level)

- `UserDashboard.jsx`: now renders only the active view (either Raise or My Complaints) and displays complaints as square cards.
- `getMyGrievances()` (in `src/utils/api.js`): normalizes image URLs and, when a JWT is present, fetches image blobs with Authorization and stores an object URL (`imageBlobUrl`) on each complaint.
- CSS moved to per-component files. Shared utilities remain in `src/App.css`.

Files worth checking:
- `frontend/src/components/UserDashboard.jsx`
- `frontend/src/components/UserDashboard.css`
- `frontend/src/utils/api.js`
- `frontend/src/components/SideNav.css` (controls selecting Raise/My)

---

## Why images failed to load (short)

Browser <img> requests do not include custom Authorization headers. Since your image endpoint requires a JWT, direct <img src="/api/grievances/ID/image"> returned 401/403 and the image did not show.

---

## How the frontend fixes it (step-by-step)

1. The frontend calls `GET /api/grievances/me` to get metadata (title, category, imageUrl pointing to `/api/grievances/{id}/image`).
2. If there is a JWT in localStorage, the frontend does a `fetch(imageUrl, { headers: { Authorization: `Bearer ${token}` } })` to retrieve the image bytes.
3. Convert the response to a Blob (`res.blob()`), create an object URL `URL.createObjectURL(blob)`, and attach it as `imageBlobUrl` on that complaint object.
4. In the UI we prefer `imageBlobUrl` for `<img src=...>` so the browser shows the fetched image without needing to send headers from the <img> tag.

This keeps backend security intact and still displays images in the UI.

---

## How to run & test locally (PowerShell copy/paste)

1) Start the backend (make sure it is running at http://localhost:8081).

2) Start the frontend dev server:

```powershell
cd "d:\Infosys Projects\CivcPulse\frontend"
npm run dev
```

3) Login (or register) so a JWT is saved in localStorage as `jwt`.

4) Open Dashboard -> select "My Complaints". If complaints have images, they should appear in square cards.

5) To test submit flow: open Raise Complaint, submit a complaint with an image, then go back to My Complaints to confirm it appears.

---

## Memory & performance — important (short, actionable)

- Each `URL.createObjectURL()` must be revoked when no longer needed. Otherwise the browser holds the blob in memory.
- Add a cleanup that revokes object URLs when the component unmounts or when the complaint list is refreshed.

Recommended cleanup snippet (copy/paste into `UserDashboard.jsx`):

```jsx
// inside UserDashboard component
useEffect(() => {
  // run when component unmounts or before complaints update
  return () => {
    complaints.forEach(c => { if (c.imageBlobUrl) URL.revokeObjectURL(c.imageBlobUrl) })
  }
}, [complaints])
```

Better approach: keep a Set of created object URLs and revoke only those. This prevents accidentally revoking URLs still in use.

---

## Alternatives & future improvements (recommended)

- Lazy-load images with IntersectionObserver so only visible cards fetch blobs.
- Create a backend thumbnail endpoint to serve small images for list views (less bandwidth). This requires a backend change but improves performance.
- Use signed URLs (short-lived) if you prefer letting <img> load images directly without fetching via JS.

---

## Troubleshooting quick checklist

- If images still don't appear:
  1. Confirm JWT is in `localStorage` under `jwt`.
  2. Open browser devtools -> Network: refresh My Complaints and check image fetch requests — they should be XHR/Fetch requests made by the JS (not image <img> requests) and return 200 with an image content-type.
  3. If the fetch returns 401/403, check backend logs for auth errors and confirm the JWT is valid.

---

If you want, I can:
- Add the cleanup snippet into `UserDashboard.jsx` now.
- Implement lazy-loading for images.
- Modify the backend to return small thumbnails and document the API change.

Which of the above should I do next? (I recommend adding the cleanup snippet first.)
