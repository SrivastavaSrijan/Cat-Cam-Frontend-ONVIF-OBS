import React, { useState } from "react";
import { CssBaseline, Box, Stack, Divider } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Navbar from "./components/Navbar";
import CameraSelector from "./components/CameraSelector";
import MovementControls from "./components/MovementControls";
import Presets from "./components/Presets";
import darkTheme from "./theme";
import { SelectedCameraProvider } from "./utils/useSelectedCamera";
import RunnerScript from "./components/RunnerScript";
import SceneManager from "./components/SceneManager";

const App: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SelectedCameraProvider>
        <Navbar value={value} handleChange={handleChange} />
        <Box sx={{ p: 1 }}>
          <Stack sx={{ display: value !== 0 ? "none" : "flex" }} gap={4} m={1}>
            <CameraSelector />
            <Divider variant="middle" />
            <Presets />
            <Divider variant="middle" />
            <MovementControls />
          </Stack>
          <Stack sx={{ display: value !== 1 ? "none" : "flex" }} gap={4} m={1}>
            {" "}
            <SceneManager />
            <Divider variant="middle" />
            <RunnerScript />
          </Stack>
        </Box>
      </SelectedCameraProvider>
    </ThemeProvider>
  );
};

export default App;
