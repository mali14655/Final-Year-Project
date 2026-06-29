export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function cropImageToSquareBlob(image, { scale, offsetX, offsetY, outputSize = 400, mimeType = "image/jpeg", quality = 0.92 }) {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");

  const baseScale = Math.max(outputSize / image.width, outputSize / image.height);
  const drawScale = baseScale * scale;
  const drawWidth = image.width * drawScale;
  const drawHeight = image.height * drawScale;
  const x = (outputSize - drawWidth) / 2 + offsetX;
  const y = (outputSize - drawHeight) / 2 + offsetY;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(image, x, y, drawWidth, drawHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to process image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}
