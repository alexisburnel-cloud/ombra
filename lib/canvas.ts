export function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  const width = imageRatio > canvasRatio ? canvasHeight * imageRatio : canvasWidth;
  const height = imageRatio > canvasRatio ? canvasHeight : canvasWidth / imageRatio;
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, x, y, width, height);
}
