export function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (canvasRatio < 0.9) {
    /* écran portrait : la maison ENTIÈRE, ajustée à la largeur, centrée —
       plus de recadrage sauvage sur les côtés */
    const width = canvasWidth;
    const height = canvasWidth / imageRatio;
    const y = (canvasHeight - height) / 2;
    context.drawImage(image, 0, y, width, height);
    return;
  }

  const width = imageRatio > canvasRatio ? canvasHeight * imageRatio : canvasWidth;
  const height = imageRatio > canvasRatio ? canvasHeight : canvasWidth / imageRatio;
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;
  context.drawImage(image, x, y, width, height);
}
