import React, { useEffect, useState } from "react";
import { CssBaseline, Stack, Divider } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Navbar from "./components/Navbar";
import CameraSelector from "./components/CameraSelector";
import MovementControls from "./components/MovementControls";
import Presets from "./components/Presets";
import darkTheme from "./theme";
import { SelectedCameraProvider } from "./utils/useSelectedCamera";
import RunnerScript from "./components/RunnerScript";
import SceneManager from "./components/SceneManager";
import LiveStream from "./components/LiveStream";

const App: React.FC = () => {
  const [value, setValue] = useState(1);
  const [isLiveView, setIsLiveView] = useState(false);

  useEffect(() => {
    setIsLiveView(
      !!new URLSearchParams(window.location.search).get("liveview")
    );
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SelectedCameraProvider>
        <Navbar value={value} handleChange={handleChange} />
        <Stack gap={4} sx={{ p: 1 }}>
          {isLiveView && (
            <>
              <LiveStream streamKey="mosaic" />
              <Divider variant="middle" />
            </>
          )}
          <Stack sx={{ display: value !== 1 ? "none" : "flex" }} gap={4} m={1}>
            <CameraSelector />
            <Divider variant="middle" />
            <Presets />
            <Divider variant="middle" />
            <MovementControls />
          </Stack>
          <Stack sx={{ display: value !== 2 ? "none" : "flex" }} gap={4} m={1}>
            {" "}
            <SceneManager />
            <Divider variant="middle" />
            <RunnerScript />
          </Stack>
        </Stack>
      </SelectedCameraProvider>
    </ThemeProvider>
  );
};

export default App;
