/** TRD §6: gentle viewport-edge autoscroll during drag. */
export function autoScrollForPoint(clientX: number, clientY: number): void {
  // Scroll only when the cursor is very close to the viewport edge.
  const edgeZone = 20;
  // Keep speed intentionally low for controllable drop targeting.
  const maxSpeed = 6;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  let viewportDx = 0;
  let viewportDy = 0;

  const leftViewport = clientX;
  const rightViewport = viewportW - clientX;
  const topViewport = clientY;
  const bottomViewport = viewportH - clientY;

  if (leftViewport < edgeZone) {
    viewportDx = -edgeSpeed(edgeZone - leftViewport, edgeZone, maxSpeed);
  } else if (rightViewport < edgeZone) {
    viewportDx = edgeSpeed(edgeZone - rightViewport, edgeZone, maxSpeed);
  }

  if (topViewport < edgeZone) {
    viewportDy = -edgeSpeed(edgeZone - topViewport, edgeZone, maxSpeed);
  } else if (bottomViewport < edgeZone) {
    viewportDy = edgeSpeed(edgeZone - bottomViewport, edgeZone, maxSpeed);
  }

  if (viewportDx === 0 && viewportDy === 0) return;
  window.scrollBy(viewportDx, viewportDy);
}

function edgeSpeed(depth: number, margin: number, maxSpeed: number): number {
  const t = Math.max(0, Math.min(1, depth / margin));
  // Gentle cubic ramp keeps movement smooth and easy to stop.
  return maxSpeed * t * t * t;
}
