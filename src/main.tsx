import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { launchGame } from "./runtime/launchGame";
import "./style.css";
function Game() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = launchGame(host.current);
    return () => game.destroy(true);
  }, []);
  return (
    <div
      ref={host}
      className="game-host"
      aria-label="Typewarts — сюжетная игра для обучения печати"
    />
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>,
);
