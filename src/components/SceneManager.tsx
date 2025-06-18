import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import {
  Select,
  MenuItem,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { fetchWrapper } from "../utils/fetch";
import { API_BASE_URL } from "../config";
import { Refresh, Restore } from "@mui/icons-material";
import type { GetSceneResponse } from "../interfaces";

const SceneManager: React.FC = () => {
  const [scenes, setScenes] = useState<GetSceneResponse["scenes"]>([]);
  const [selectedScene, setSelectedScene] = useState<string>("Mosaic");
  const [transformation, setTransformation] = useState<string>("Mosaic");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnectIfNeeded = async () => {
    setLoading(true);
    setError(null);
    await fetchWrapper(
      `${API_BASE_URL}/obs/reconnect`,
      "POST",
      undefined,
      () => {
        setLoading(false);
      },
      (error) => {
        console.error("Failed to reconnect:", error);
        setError("Failed to reconnect to OBS");
        setLoading(false);
      }
    );
  };

  // Fetch available scenes
  const fetchScenes = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchWrapper(
      `${API_BASE_URL}/obs/scenes`,
      "GET",
      undefined,
      (response: GetSceneResponse) => {
        setScenes([
          { name: "Mosaic", obs_scene: "Mosaic" },
          { name: "Please Wait", obs_scene: "Please Wait" },
          ...(response.scenes || []),
        ]);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch scenes:", error);
        setError("Failed to fetch scenes from OBS");
        setLoading(false);
      }
    );
  }, []);

  // Switch scene handler
  const switchScene = (currValue: string) => {
    if (!currValue) return;
    setLoading(true);
    setError(null);
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
        setError("Failed to switch scene");
        setLoading(false);
      }
    );
  };

  // Apply transformation handler
  const applyTransformation = (
    selectedTransformation: typeof transformation
  ) => {
    setLoading(true);
    setError(null);
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
        setError("Failed to apply transformation");
        setLoading(false);
      }
    );
  };

  // Refresh RTSP streams with 5-second "Please Wait" toggle
  const refreshStreams = async () => {
    setRefreshing(true);
    setError(null);

    // Switch to "Please Wait" scene
    await fetchWrapper(
      `${API_BASE_URL}/obs/switch_scene`,
      "POST",
      { scene_name: "Please Wait" },
      () => {
        console.log("Switched to Please Wait scene");
        setSelectedScene("Please Wait");
      },
      (error) => {
        console.error("Failed to switch to Please Wait:", error);
        setError("Failed to switch to Please Wait scene");
      }
    );

    // Wait 5 seconds
    setTimeout(async () => {
      // Switch back to Mosaic
      await fetchWrapper(
        `${API_BASE_URL}/obs/switch_scene`,
        "POST",
        { scene_name: "Mosaic" },
        () => {
          console.log("Switched back to Mosaic scene");
          setSelectedScene("Mosaic");
          setRefreshing(false);
        },
        (error) => {
          console.error("Failed to switch back to Mosaic:", error);
          setError("Failed to switch back to Mosaic");
          setRefreshing(false);
        }
      );
    }, 5000);
  };

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  return (
    <Stack gap={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack gap={1}>
        <Stack justifyContent="space-between" direction="row" spacing={2}>
          <Typography variant="h6" gutterBottom>
            Apply Transformation
          </Typography>
          {/* Transformation Controls */}
          <Stack direction="row" alignItems="center" gap={2}>
            {loading && <CircularProgress color="primary" size={16} />}
            <IconButton
              color="primary"
              onClick={async () => {
                await reconnectIfNeeded();
                await fetchScenes();
              }}
              disabled={loading}
            >
              <Refresh />
            </IconButton>
          </Stack>
        </Stack>
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
              disabled={loading}
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

      <Stack gap={1}>
        <Stack justifyContent="space-between" direction="row" spacing={2}>
          <Typography variant="h6" gutterBottom>
            RTSP Stream Refresh
          </Typography>
          <Button
            variant="outlined"
            startIcon={
              refreshing ? <CircularProgress size={16} /> : <Restore />
            }
            onClick={refreshStreams}
            disabled={refreshing || loading}
            color="primary"
          >
            {refreshing ? "Refreshing..." : "Refresh Streams"}
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          This will show "Please Wait" for 5 seconds to refresh all RTSP
          streams, then return to the Mosaic view.
        </Typography>
      </Stack>

      <Stack gap={1}>
        <Typography variant="h6" gutterBottom>
          Scene Switcher
        </Typography>
        <Stack gap={1}>
          {/* Scene Selection */}
          <FormControl>
            <Select
              value={selectedScene}
              onChange={(e) => switchScene(e.target.value)}
              disabled={loading || refreshing}
            >
              {scenes.map(({ obs_scene: scene }) => (
                <MenuItem key={scene} value={scene}>
                  {scene}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SceneManager;
