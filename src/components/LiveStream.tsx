import React, { FC, useEffect, useState } from "react";
import ReactOvenPlayer, { ReactOvenPlayerState } from "./OvenPlayer";
import { API_BASE_URL } from "../config";

const HLSPlayer: FC<{ streamKey: string }> = ({ streamKey }) => {
  const [state, setState] = useState<ReactOvenPlayerState | null>(null);
  const apiUrl =
    API_BASE_URL.replace(/:\d+$/, ":3333").replace("http", "ws") +
    `/app/${streamKey}?direction=send`;

  useEffect(() => {
    state?.instance?.pause();
  }, [state]);

  return (
    <div>
      <ReactOvenPlayer
        wrapperStyles={{
          minWidth: 500,
        }}
        setState={setState}
        config={{
          autoStart: true,
          autoFallback: true,
          controls: true,
          showBigPlayButton: false,
          mute: true,
          webrtcConfig: {
            timeoutMaxRetry: 5,
            connectionTimeout: 10000,
          },

          sources: [
            {
              type: "webrtc",
              file: apiUrl,
            },
          ],
        }}
      />
    </div>
  );
};

export default HLSPlayer;
