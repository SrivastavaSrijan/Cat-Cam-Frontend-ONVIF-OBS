import type React from "react";
import {
  Typography,
  Alert,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
} from "@mui/material";
import { Videocam } from "@mui/icons-material";
import { useAppContext } from "../contexts/AppContext";
import { useAutoDismissError } from "../hooks";
import { CAMERA_PRESETS } from "../utils/contants";
import SkeletonLoader from "./SkeletonLoader";

const Presets: React.FC = () => {
  const { selectedCamera, getCameraData, gotoPreset } = useAppContext();
  const { error, setError } = useAutoDismissError();

  const cameraData = selectedCamera ? getCameraData(selectedCamera) : null;
  const presets = cameraData?.presets || [];
  const selectedPreset = cameraData?.selectedPreset || null;
  const loading = cameraData?.isLoading || false;

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
            {loading ? (
              <SkeletonLoader variant="presets" />
            ) : presets.length > 0 ? (
              <ToggleButtonGroup
                exclusive
                value={selectedPreset}
                onChange={(_, value) =>
                  value && selectedCamera && gotoPreset(selectedCamera, value)
                }
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
                No presets
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Movement Controls */}
    </Stack>
  );
};

export default Presets;
