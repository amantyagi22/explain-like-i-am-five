"use client";

import { CameraSlash, ImageSquare } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { prepareImage } from "@/lib/prepare-image";
import { ExplanationPanel } from "./explanation-panel";

type Camera = { status: "starting" | "on" } | { status: "off"; reason: string };
type Photo = { blob: Blob; url: string };

// Owns the camera stream, freeze/unfreeze, and the upload fallback.
// Both capture paths produce one prepared JPEG, so everything after capture is identical.
export function Eli5Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState<Camera>({ status: "starting" });
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    // Async wrapper so a missing navigator.mediaDevices (insecure context, some in-app browsers) lands in .catch.
    (async () => navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }))()
      .then((s) => {
        stream = s;
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        videoRef.current!.srcObject = s;
        setCamera({ status: "on" });
      })
      .catch((error: unknown) => {
        if (!cancelled) setCamera({ status: "off", reason: cameraProblem(error) });
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function capture(source: HTMLVideoElement | Blob) {
    setCapturing(true);
    setNotice(null);
    try {
      const blob = await prepareImage(source);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
    } catch {
      resumeVideo();
      setNotice("That photo couldn't be opened. Try a JPEG or PNG.");
    } finally {
      setCapturing(false);
    }
  }

  function snap() {
    const video = videoRef.current!;
    video.pause(); // freeze on the exact frame right away, before encoding finishes
    capture(video);
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file twice
    if (file) capture(file);
  }

  function backToCamera() {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    resumeVideo();
  }

  function resumeVideo() {
    if (camera.status === "on") videoRef.current?.play().catch(() => {}); // play() rejects if interrupted; harmless
  }

  const cameraAvailable = camera.status !== "off";
  const pickPhoto = () => fileRef.current?.click();

  return (
    <main className="fixed inset-0 overflow-hidden bg-zinc-950 select-none">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 size-full object-cover ${camera.status === "on" ? "" : "invisible"}`}
      />

      {photo && (
        <button onClick={backToCamera} aria-label="Back to camera" className="absolute inset-0 cursor-default">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL, nothing for next/image to optimize */}
          <img src={photo.url} alt="Your photo" className="size-full object-cover" />
        </button>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/40 to-transparent px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-10 [text-shadow:0_1px_10px_rgb(9_9_11/0.7)]">
        <p className="text-[15px] font-semibold tracking-tight">ELI5 Camera</p>
        {cameraAvailable && !photo && <p className="mt-0.5 text-sm text-zinc-100">Point at anything and tap the shutter.</p>}
      </header>

      {camera.status === "off" && !photo && (
        <div className="absolute inset-0 flex flex-col justify-end px-6 pt-24 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <CameraSlash size={40} className="text-accent" />
          <h1 className="mt-6 text-4xl leading-tight font-semibold tracking-tight">The camera is off</h1>
          <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-zinc-400">
            {camera.reason} You can still upload a photo to explain.
          </p>
          {notice && <p className="mt-4 text-sm text-accent">{notice}</p>}
          <button
            onClick={pickPhoto}
            disabled={capturing}
            className="mt-8 h-14 w-full rounded-full bg-accent text-base font-semibold text-zinc-950 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Upload a photo instead
          </button>
        </div>
      )}

      {cameraAvailable && !photo && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/70 to-transparent px-8 pt-16 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          {camera.status === "starting" && (
            <p className="mb-6 text-center text-sm text-zinc-400">Starting the camera…</p>
          )}
          {notice && <p className="mb-6 text-center text-sm text-accent">{notice}</p>}
          <div className="grid grid-cols-3 items-center">
            <button
              onClick={pickPhoto}
              disabled={capturing}
              aria-label="Upload a photo"
              className="grid size-12 place-items-center rounded-full bg-white/10 backdrop-blur-md transition-transform active:scale-95 disabled:opacity-40"
            >
              <ImageSquare size={24} />
            </button>
            <button
              onClick={snap}
              disabled={camera.status !== "on" || capturing}
              aria-label="Take photo"
              className="grid size-20 place-items-center justify-self-center rounded-full border-4 border-white transition-transform active:scale-[0.92] disabled:opacity-40"
            >
              <span className="size-[62px] rounded-full bg-white" />
            </button>
          </div>
        </div>
      )}

      {photo && (
        <ExplanationPanel
          key={photo.url}
          photo={photo.blob}
          onClose={backToCamera}
          closeLabel={cameraAvailable ? "Snap another" : "Try another photo"}
        />
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
    </main>
  );
}

function cameraProblem(error: unknown): string {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError") return "Camera access was blocked. You can allow it in your browser settings.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "This device doesn't seem to have a camera.";
  return "This browser can't open the camera. Apps with built-in browsers often block it.";
}
