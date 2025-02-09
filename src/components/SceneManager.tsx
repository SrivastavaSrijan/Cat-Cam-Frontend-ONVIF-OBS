import React, { useState, useEffect } from "react";
import { CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import {
  Select,
  MenuItem,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { fetchWrapper } from "../utils/fetch";
import { API_BASE_URL } from "../config";
import { Refresh } from "@mui/icons-material";
import { GetSceneResponse } from "../interfaces";

const SceneManager: React.FC = () => {
  const [scenes, setScenes] = useState<GetSceneResponse["scenes"]>([]);
  const [selectedScene, setSelectedScene] = useState<string>("Mosaic");
  const [transformation, setTransformation] = useState<string>("Mosaic");
  const [loading, setLoading] = useState(false);

  const reconnectIfNeeded = async () => {
    setLoading(true);
    await fetchWrapper(
      `${API_BASE_URL}/obs/reconnect`,
      "POST",
      undefined,
      (response: GetSceneResponse) => {
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch scenes:", error);
        setLoading(false);
      }
    );
  };

  // Fetch available scenes
  const fetchScenes = async () => {
    setLoading(true);
    await fetchWrapper(
      `${API_BASE_URL}/obs/scenes`,
      "GET",
      undefined,
      (response: GetSceneResponse) => {
        setScenes([
          { name: "Mosaic", obs_scene: "Mosaic" },
          ...(response.scenes || []),
        ]);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch scenes:", error);
        setLoading(false);
      }
    );
  };

  // Switch scene handler
  const switchScene = (currValue: string) => {
    if (!currValue) return console.log("Please select a scene to switch.");
    setLoading(true);
    fetchWrapper(
      `${API_BASE_URL}/obs/switch_scene`,
      "POST",
      { scene_name: currValue },
      () => {
        console.log(`Successfully switched to scene: ${currValue}`);
        setSelectedScene(currValue);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to switch scene:", error);
        setLoading(false);
      }
    );
  };

  // Apply transformation handler
  const applyTransformation = (
    selectedTransformation: typeof transformation
  ) => {
    setLoading(true);
    const body = {
      active_source: selectedTransformation,
      type: selectedTransformation !== "Mosaic" ? "highlight" : "grid",
    };
    fetchWrapper(
      `${API_BASE_URL}/obs/transform`,
      "POST",
      body,
      () => {
        console.log(
          `Transformation applied: ${body?.type} <> ${body?.active_source}`
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to apply transformation:", error);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchScenes();
  }, []);

  return (
    <Stack>
      <Stack justifyContent="space-between" direction="row" spacing={2}>
        <Typography variant="h6" gutterBottom>
          Scene Manager
        </Typography>
        <Stack direction="row" alignItems="center" gap={2}>
          {loading && <CircularProgress color="primary" size={16} />}
          <IconButton
            color="primary"
            onClick={async () => {
              await reconnectIfNeeded();
              await fetchScenes();
            }}
          >
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>
      <Stack gap={2}>
        {/* Scene Selection */}
        <FormControl>
          <Select
            value={selectedScene}
            onChange={(e) => switchScene(e.target.value)}
            disabled={loading}
          >
            {scenes.map(({ obs_scene: scene }) => (
              <MenuItem key={scene} value={scene}>
                {scene}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {/* Transformation Controls */}
      <h3>Apply Transformation</h3>
      <ToggleButtonGroup
        sx={{ display: "block", columnCount: 2 }}
        color="primary"
        value={transformation}
        exclusive
        onChange={(_, value) => {
          if (value) {
            setTransformation(value);
            applyTransformation(value);
          }
        }}
        fullWidth
      >
        {scenes.map(({ name }) => (
          <ToggleButton
            key={name}
            value={name}
            sx={{
              my: 1,
              borderLeft: "1px solid rgba(255, 255, 255, 0.12) !important",
            }}
          >
            {name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};

export default SceneManager;
