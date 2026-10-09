# 05 - Visual polish pass

**What to build:** the app looks polished and intentional on a phone screen, like a real product.
Use the `design-taste-frontend` (v2) skill and design mobile-first.
The UI respects safe-area insets so the notch and home indicator never hide any controls.
The explanation panel sits over the bottom of the frozen photo so the photo and the answer are visible together.
Every state looks deliberate: live preview, streaming, done, error, quota exhausted, camera-denied message, and upload fallback.

**Blocked by:** 02 - Route checks and friendly failure messages, 03 - Live camera snap, 04 - Vercel preview deploy and phone check

**Status:** ready-for-agent

- [ ] UI built with the `design-taste-frontend` (v2) skill, mobile-first
- [ ] Controls respect safe-area insets on notched phones
- [ ] Panel sits over the bottom of the frozen photo, and long explanations stay readable
- [ ] Every screen state reviewed on a real phone through a Vercel preview URL, with nothing visually off
- [ ] Shutter is large and easy to reach with one thumb
