import React, { FC, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import VideoJS from "./VideoJS";
import { API_BASE_URL } from "../config";

const HLSPlayer: FC<{ streamKey: string }> = ({ streamKey }) => {
  const videoRef = useRef(null);

  const apiUrl = API_BASE_URL.replace(/:\d+$/, ":8080");
  const videoJsOptions = {
    autoplay: "muted",
    controls: true,
    responsive: true,
    fluid: true,
    preload: "auto",
    muted: true,
    sources: [
      {
        src: `${apiUrl}/hls/${streamKey}.m3u8`,
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player: any) => {
    videoRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };

  return (
    <div>
      <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
    </div>
  );
};

export default HLSPlayer;
