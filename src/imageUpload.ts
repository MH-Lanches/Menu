export type AreaPixels = { width: number; height: number; x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar blob"));
    }, type, quality);
  });
}

export async function cropResizeCompress(
  imageSrc: string,
  crop: AreaPixels,
  opts?: { maxWidth?: number; maxKB?: number; format?: "image/webp" | "image/jpeg" }
) {
  const image = await loadImage(imageSrc);
  const maxWidth = opts?.maxWidth || 1024;
  const maxKB = opts?.maxKB || 280;
  const format = opts?.format || "image/webp";

  const safeCrop = {
    x: clamp(crop.x, 0, image.width),
    y: clamp(crop.y, 0, image.height),
    width: clamp(crop.width, 1, image.width),
    height: clamp(crop.height, 1, image.height),
  };

  const ratio = safeCrop.width / safeCrop.height || 1;
  const targetWidth = Math.min(maxWidth, safeCrop.width);
  const targetHeight = Math.round(targetWidth / ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    safeCrop.x,
    safeCrop.y,
    safeCrop.width,
    safeCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, format, quality);
  while (blob.size / 1024 > maxKB && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, format, quality);
  }

  if (blob.size / 1024 > maxKB) {
    const scale = Math.sqrt((maxKB * 1024) / blob.size) * 0.98;
    const resized = document.createElement("canvas");
    resized.width = Math.max(320, Math.round(targetWidth * scale));
    resized.height = Math.max(320 / ratio, Math.round(targetHeight * scale));
    const rctx = resized.getContext("2d");
    if (!rctx) throw new Error("Canvas indisponível");
    rctx.imageSmoothingEnabled = true;
    rctx.imageSmoothingQuality = "high";
    rctx.drawImage(canvas, 0, 0, resized.width, resized.height);
    blob = await canvasToBlob(resized, format, Math.max(0.5, quality));
  }

  const previewUrl = URL.createObjectURL(blob);
  const ext = format === "image/jpeg" ? "jpg" : "webp";
  return { blob, previewUrl, width: canvas.width, height: canvas.height, ext };
}
