import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

type Props = { onDetected: (code: string) => void };

export default function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function start() {
    setError(null);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      setActive(true);
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result) => {
          if (result) {
            onDetected(result.getText());
            controls.stop();
            controlsRef.current = null;
            setActive(false);
          }
        },
      );
      controlsRef.current = controls;
    } catch {
      setActive(false);
      setError("Camera unavailable. Type the barcode manually instead.");
    }
  }

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-secondary aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {active && (
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-accent animate-scanline" />
        )}
        {!active && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Camera preview
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="button" variant={active ? "secondary" : "default"} onClick={active ? stop : start}>
        {active ? <CameraOff /> : <Camera />}
        {active ? "Stop camera" : "Scan with camera"}
      </Button>
    </div>
  );
}
