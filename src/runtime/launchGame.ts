import Phaser from "phaser";
import { stageSize, RENDER_SCALE } from "./display";
import { LoadingScene } from "../scenes/LoadingScene";
import { GameScene } from "../scenes/GameScene";

export function launchGame(parent: HTMLElement) {
  const width = parent.clientWidth || window.innerWidth;
  const height = parent.clientHeight || window.innerHeight;
  const size = stageSize(width, height);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#09121c",
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
      zoom: width / (size.width * RENDER_SCALE),
      width: size.width * RENDER_SCALE,
      height: size.height * RENDER_SCALE,
    },
    callbacks: {
      postBoot: (game) => {
        const observer = new ResizeObserver(() => {
          const { clientWidth: width, clientHeight: height } = parent;
          if (!width || !height) return;
          const next = stageSize(width, height);
          const renderWidth = next.width * RENDER_SCALE;
          const renderHeight = next.height * RENDER_SCALE;
          const zoom = width / renderWidth;
          if (Math.abs(game.scale.zoom - zoom) > 0.000001) {
            game.scale.setZoom(zoom);
          }
          if (Math.abs(game.scale.width - renderWidth) > 0.01 ||
              Math.abs(game.scale.height - renderHeight) > 0.01) {
            game.scale.resize(renderWidth, renderHeight);
          }
          game.scale.updateBounds();
        });
        observer.observe(parent);
        game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect());
      },
    },
    scene: [LoadingScene, GameScene],
    audio: { noAudio: true },
    render: { antialias: true, pixelArt: false, roundPixels: false },
    input: { keyboard: true },
  });
}
