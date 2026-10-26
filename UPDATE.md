# BL Driver Journal v0.3

Live private app: https://bl-driver-journal.cleareagle258.chatgpt.site
Viewer service: https://bl-live-transfer.cleareagle258.chatgpt.site (needs a per-transfer fragment token)

## Behavior
- Select BTRF/KTRF/TRF/LTH/SE/One Way/Privát. Notes can contain a name.
- Indulás captures timestamp and GPS coordinate, then samples roughly every 60 seconds while visible.
- Befejezés fixes the end time immediately and requests the arrival coordinate. If GPS fails, it still ends the job and marks the missing location.
- Szünet freezes billing and GPS; Folytatás captures a new position and excludes the paused interval and detour from estimates.
- Fee is elapsed active milliseconds × 3000 Ft/hour, rounded per transfer. GPS does not determine billing time.
- GPS distance is filtered straight-line sample distance, not actual road length. Long gaps, implausible speeds and inaccurate points are not accumulated. Start/end coordinates remain usable in Google Maps.
- GPS coordinates are not automatically reverse-geocoded to postal addresses.
- Foreground clock updates every 15 seconds, GPS every 60 seconds. Hidden/idle/paused views have no repeating GPS or display timers. No Wake Lock or map tiles on the driver page. Small GPS snapshots avoid repeatedly rewriting photo/history data.
- GPS sampling is automatic during an active job. Sharing is separately opt-in via LIVE indítása, Link megosztása, LIVE leállítása. A stopped job revokes its link.
- Viewer URLs carry random 256-bit read tokens in the fragment. Only token hashes are stored server-side. Readers see only status and latest coordinates/accuracy/timestamp, no name, fee, notes or photos.
- Viewer tokens expire after 12 hours. Stopping hides the position immediately when online; offline revocations stay pending and retry on reconnect/visibility. Last known position may remain visible until successful revocation or expiry. Expired records are removed on subsequent access, not by a guaranteed scheduled purge.
- App stays owner-private; separate viewer service is public but position reads require the per-trip token. Relay writes require a shared server-side LIVE_RELAY_SECRET. Never put that secret in client code or Git.
- Hero uses the first selected New York scene with a soft edge mask and no frame.

## Deployment/source
Root is the private driver app. relay/ contains the separate public viewer service. Each uses its own .openai/hosting.json and Worker build. Configure LIVE_RELAY_SECRET identically on both services using runtime secrets.
Run node scripts/generate.mjs, bash scripts/build.sh, node scripts/validate-artifact.mjs. Run tests with node scripts/test.mjs in each root.

## Validation and limits
Automated frontend tests cover GPS start/end, 2h minus 30min pause = 4500 Ft, old records, idle/paused/hidden timers, GPS gaps. Relay tests cover authentication, token hashing, invalid positions, pause privacy, stop and expiry. Desktop visual review verified the UI and crop. Real-phone GPS accuracy, mobile share sheet and measured battery savings have not been validated on hardware.

The browser does not guarantee background location. Leave the page visible for fresh updates. Job records/photos are still device-local; no Drive, passkey or multi-device synchronization in this release.

Selected hero: first New York generated scene; later face edits rejected by user. Original PNG retained, WebP used for lower transfer size.


Final hero: first New York man/scene. All four edges fade fully into the app background.

## v0.4 – own passkey unlock
Sites owner-only sign-in is preserved. Register a separate WebAuthn passkey inside the app to activate an additional server-enforced unlock. This is unrelated to the OpenAI account passkey. Platform authenticator and user verification are required; the device may use fingerprint, face or PIN. The app never receives biometric data. D1 stores public keys, counters, one-use 5-minute challenges and hashed opaque unlock tokens. Secure HttpOnly SameSite=Strict session cookie; maximum unlock duration 12 hours. Locked app and LIVE API routes require verification. Existing device-local records are preserved but are not encrypted by this feature. Manual lock stops foreground GPS, not elapsed work billing. Up to five keys can be registered; adding another requires current unlock. Lost all keys requires owner-assisted recovery, not a client-side bypass. No automatic first-key enrollment; the owner must tap setup and approve on their device.
Validation: real cryptographic registration/assertion fixtures through server code and SQLite; bad origin/signature/user verification, replay, missing identity, expired challenges and sessions, API gate, logout rejected/handled correctly. Hardware fingerprint enrollment requires the owner on the target phone.

Opening screen: original Black Limousine logo from https://blacklimousine.hu/wp-content/uploads/2025/04/logo01.png, embedded locally on both app and lock views. Fades after 1.15 seconds with no network request or recurring timer; reduced-motion setting uses 0.2 seconds.
