import type React from "react";
import {
  Typography,
  Alert,
  Stack,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
} from "@mui/material";
import { Refresh, Videocam } from "@mui/icons-material";
import { useCameraDataManagerContext } from "../contexts/CameraDataManagerContext";
import { useCameraControl, useAutoDismissError } from "../hooks";
import { CAMERA_PRESETS } from "../utils/contants";
import MovementControls from "./MovementControls";

const CameraControl: React.FC = () => {
  const { selectedCamera } = useCameraDataManagerContext();
  const { error, setError } = useAutoDismissError();
  const { presets, selectedPreset, loading, gotoPreset, moveCamera, refresh } =
    useCameraControl(selectedCamera);

  if (!selectedCamera) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Videocam color="disabled" />
            <Typography variant="body1" color="text.secondary">
              Select a camera to begin
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Presets */}
      <Card>
        <CardContent>
          <Stack gap={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Presets
              </Typography>
              <IconButton onClick={refresh} disabled={loading} size="small">
                <Refresh fontSize="inherit" />
              </IconButton>
            </Stack>

            {presets.length > 0 ? (
              <ToggleButtonGroup
                exclusive
                value={selectedPreset}
                onChange={(_, value) => value && gotoPreset(value)}
                fullWidth
                color="primary"
              >
                {presets.map((preset) => (
                  <ToggleButton
                    key={preset.Token}
                    value={preset.Token}
                    size="small"
                  >
                    <Typography fontSize="small" textTransform="none">
                      {CAMERA_PRESETS.get(selectedCamera)?.get(preset.Name) ||
                        preset.Name}
                    </Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                {loading ? "Loading..." : "No presets"}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Movement Controls */}
    </Stack>
  );
};

export default CameraControl;
