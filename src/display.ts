// Logical stage dimensions stay fixed. Render more pixels, not a different layout.
export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 900;
export const RENDER_SCALE = Math.min(3, Math.max(2, Math.ceil(
  Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT)
    * (window.devicePixelRatio || 1),
)));
export const TEXT_RESOLUTION = RENDER_SCALE;
