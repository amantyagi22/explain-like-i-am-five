# 03 - Live camera snap

**What to build:** the app opens straight into a live rear-camera preview with a large shutter button.
Tapping the shutter freezes the exact frame and streams its explanation through the same flow as the upload path.
Tapping "Snap another" or the photo returns to the live preview.
The shutter is disabled while an explanation is streaming.
Camera permission is requested only when the camera is about to start.
If the camera can't be used (permission denied, no camera, an in-app browser that blocks it), I see a clear message and an "Upload a photo instead" button that uses the upload flow from ticket 01.
Whether it comes from the camera or a file, the capture produces one image blob, so everything after capture is identical.

**Blocked by:** 01 - Upload a photo, get a streamed ELI5 explanation

**Status:** ready-for-agent

- [ ] App opens into a live preview, preferring the rear-facing camera
- [ ] Shutter freezes the exact captured frame and the explanation streams over it
- [ ] "Snap another" and tapping the photo both return to live preview
- [ ] Shutter is disabled while a request is in flight
- [ ] Permission is requested only when the camera starts
- [ ] Denied permission, no device, and unsupported browsers all show a clear message and the upload fallback
- [ ] Camera and upload captures go through the same downscale-and-explain path
- [ ] Verified by hand at localhost with the laptop webcam and with the upload fallback
