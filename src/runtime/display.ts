// Reference composition; expand the stage to match the window aspect ratio.
export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 900;
export const RENDER_SCALE = Math.min(3, Math.max(2, Math.ceil(
  Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT)
    * (window.devicePixelRatio || 1),
)));
export const TEXT_RESOLUTION = RENDER_SCALE;

export function stageSize(width: number, height: number) {
  const scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
  return { width: width / scale, height: height / scale };
}
