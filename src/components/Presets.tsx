import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { fetchWrapper } from "../utils/fetch";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { useSelectedCamera } from "../utils/useSelectedCamera";
import { Refresh } from "@mui/icons-material";
import { CAMERA_PRESETS } from "../utils/contants";

interface Preset {
  Name: string;
  Token: string;
  PTZPosition: {
    PanTilt: {
      space: string;
      x: number;
      y: number;
    };
    Zoom: {
      space: string;
      x: number;
    };
  };
}

const PresetManager: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedCamera } = useSelectedCamera();

  const getStatus = useCallback(
    (fetchedPresets: Preset[]) => {
      fetchWrapper(
        `${API_BASE_URL}/ptz/status?nickname=${selectedCamera}`,
        "GET",
        undefined,
        (data: Preset) => {
          const { PTZPosition } = data;
          const currentPreset = fetchedPresets.find((preset) => {
            const { x, y } = preset.PTZPosition.PanTilt;
            return x === PTZPosition.PanTilt.x && y === PTZPosition.PanTilt.y;
          });
          setSelectedPreset(currentPreset?.Token || null);
          setLoading(false);
        }
      );
    },
    [selectedCamera]
  );

  // Fetch presets from the backend
  const fetchPresets = useCallback(async () => {
    setLoading(true);
    setError(null);
    fetchWrapper(
      `${API_BASE_URL}/ptz/presets?nickname=${selectedCamera}`,
      "GET",
      undefined,
      (data) => {
        const cleanedPresets = ((data?.presets || []) as Preset[]).filter(
          ({ PTZPosition }) =>
            PTZPosition.PanTilt.x !== -1 || PTZPosition.PanTilt.y !== 0
        );
        setPresets(cleanedPresets);
        setSelectedPreset(cleanedPresets[0]?.Token || null);
        getStatus(cleanedPresets);
      },
      (error) => {
        console.error("Failed to fetch presets: ", error);
        setLoading(false);
      }
    );
  }, [getStatus, selectedCamera]);

  // Handle preset selection
  const handlePresetSelect = async (presetId: string) => {
    setSelectedPreset(presetId);
    await fetchWrapper(
      `${API_BASE_URL}/ptz/goto_preset?nickname=${selectedCamera}`,
      "POST",
      { presetToken: presetId },
      () => console.log(`Moved to preset ${presetId} successfully!`),
      (error) => console.error(`Failed to move to preset: ${error.message}`)
    );
  };

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  return (
    <Box>
      <Stack justifyContent="space-between" direction="row" spacing={2}>
        <Typography variant="h6" gutterBottom>
          Camera Presets
        </Typography>
        <Stack direction="row" alignItems="center" gap={2}>
          {loading && <CircularProgress color="primary" size={16} />}
          <IconButton
            color="primary"
            onClick={() => {
              fetchPresets();
              getStatus(presets);
            }}
          >
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && (
        <ToggleButtonGroup
          exclusive
          value={selectedPreset}
          fullWidth
          color="primary"
          onChange={(_, value) => handlePresetSelect(value)}
        >
          {presets.map(({ Token, Name }) => (
            <ToggleButton key={Token} value={Token}>
              {CAMERA_PRESETS.get(selectedCamera)?.get(Name) || Name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    </Box>
  );
};

export default PresetManager;
