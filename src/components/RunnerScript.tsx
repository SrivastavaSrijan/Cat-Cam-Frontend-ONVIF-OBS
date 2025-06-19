import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Alert,
  Divider,
  Paper,
} from "@mui/material";
import { API_BASE_URL } from "../config";
import { fetchWrapper } from "../utils/fetch";

const RunnerScript: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [logs, setLogs] = useState<string>(""); // Store script logs
  const [progress, setProgress] = useState(0); // Simulated progress indicator

  const ref = useRef<HTMLDivElement>(null);
  // Start the detection script
  const startDetection = async () => {
    setIsRunning(true);
    setStatus(null);
    setIsPolling(true);
    setLogs("");
    setProgress(0);
    await fetchWrapper(
      `${API_BASE_URL}/start_detection`,
      "POST",
      undefined,
      () => {},
      (error) => {
        console.error("Failed to start the detection script:", error);
        setStatus("Failed to start script");
        setIsRunning(false);
      }
    );
  };

  // Stop the detection script
  const stopDetection = async () => {
    await fetchWrapper(
      `${API_BASE_URL}/stop_detection`,
      "POST",
      undefined,
      () => {
        setIsRunning(false);
        setIsPolling(false);
        setStatus("Stopped by user");
      },
      (error) => {
        console.error("Failed to stop the detection script:", error);
      }
    );
  };

  // Fetch logs from the backend
  const fetchLogs = async () => {
    await fetchWrapper(
      `${API_BASE_URL}/fetch_logs`,
      "GET",
      undefined,
      (response) => {
        setLogs(response.logs || "No logs available");
        setTimeout(() => {
          ref?.current?.scrollTo(0, ref?.current?.scrollHeight);
        }, 100);
      },
      (error) => {
        console.error("Failed to fetch logs:", error);
      }
    );
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const pollStatus = useCallback(async () => {
    await fetchWrapper(
      `${API_BASE_URL}/poll_detection_status`,
      "GET",
      undefined,
      (response) => {
        const { running, exit_code } = response;

        if (running) {
          setStatus("Running");
          setIsRunning(true);
        } else {
          setIsRunning(false);

          if (exit_code === null) {
            setStatus("Completed Successfully");
            fetchLogs();
          } else if (exit_code) {
            setIsPolling(false); // Stop polling if we have an exit code
            setStatus(`Error (Exit Code: ${exit_code})`);
            fetchLogs();
          }
        }
      },
      (error) => {
        console.error("Failed to fetch detection status:", error);
        setIsPolling(false);
        setIsRunning(false);
      }
    );
  }, []);

  // Poll the detection status
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(pollStatus, 2000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 10 : 100));
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isPolling, pollStatus]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Stack spacing={3} alignItems="center" padding={2}>
      {/* Start/Stop Buttons */}
      <Stack direction="row" gap={2}>
        <Button
          variant="contained"
          color="primary"
          disabled={isRunning || isPolling}
          onClick={startDetection}
        >
          Start Detection
        </Button>
        <Button
          variant="outlined"
          color="primary"
          disabled={!isPolling}
          onClick={stopDetection}
        >
          Stop Detection
        </Button>
      </Stack>

      {/* Status Display */}
      <Box width="100%" maxWidth={400}>
        {isRunning && !status && (
          <Stack gap={2}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" align="center">
              {progress}%
            </Typography>
          </Stack>
        )}
        {status && (
          <Alert
            variant="filled"
            severity={
              status === "Completed Successfully"
                ? "success"
                : status === "Running"
                ? "info"
                : status === "Stopped"
                ? "warning"
                : "error"
            }
          >
            {status}
          </Alert>
        )}
      </Box>

      {/* Logs Section */}
      <Divider />
      <Paper
        variant="outlined"
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: 200,
          overflowY: "auto",
          padding: 16,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Logs
        </Typography>
        <Typography
          fontFamily="monospace"
          ref={ref}
          variant="body2"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {logs || "No logs to display."}
        </Typography>
      </Paper>
    </Stack>
  );
};

export default RunnerScript;
