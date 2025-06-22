import type React from "react";
import { Skeleton, Stack, Box, Grid } from "@mui/material";

interface SkeletonLoaderProps {
  variant?:
    | "camera-selector"
    | "presets"
    | "stream-player"
    | "movement-controls"
    | "camera-overlay"
    | "action-bar"
    | "status-card"
    | "camera-list"
    | "camera-text-current"
    | "camera-text-adjacent"
    | "preset-text-current"
    | "preset-text-adjacent";

  width?: string | number;
  height?: string | number;
  size?: "small" | "medium" | "large";
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "camera-selector",
  width,
  height,
  size = "medium",
}) => {
  switch (variant) {
    case "camera-selector":
      return (
        <Stack spacing={2}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={40}
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      );

    case "presets":
      return (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <Skeleton
              variant="rectangular"
              width="25%"
              height={36}
              animation="wave"
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width="25%"
              height={36}
              animation="wave"
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width="25%"
              height={36}
              animation="wave"
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width="25%"
              height={36}
              animation="wave"
              sx={{ borderRadius: 1 }}
            />
          </Stack>
        </Stack>
      );

    case "stream-player":
      return (
        <Box
          position="relative"
          width={width || "100%"}
          height={height || 500}
          sx={{ borderRadius: 1 }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{
              borderRadius: 1,
              bgcolor: "rgba(255, 255, 255, 0.1)",
            }}
          />
          {/* Controls skeleton at bottom */}
          <Box position="absolute" bottom={8} right={8} display="flex" gap={1}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        </Box>
      );

    case "movement-controls":
      return (
        <Stack spacing={1} alignItems="center">
          {/* Up arrow */}
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            animation="wave"
          />

          {/* Left, Home, Right */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton
              variant="circular"
              width={48}
              height={48}
              animation="wave"
            />
            <Skeleton
              variant="circular"
              width={48}
              height={48}
              animation="wave"
            />
            <Skeleton
              variant="circular"
              width={48}
              height={48}
              animation="wave"
            />
          </Stack>

          {/* Down arrow */}
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            animation="wave"
          />
        </Stack>
      );

    case "camera-overlay":
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
          gap={6}
          px={4}
        >
          {/* Camera name skeleton */}
          <Box textAlign="center" width="100%">
            <Skeleton
              variant="text"
              width="60%"
              height={80}
              sx={{
                margin: "0 auto",
                fontSize: "3rem",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              }}
            />
          </Box>

          {/* Preset skeleton */}
          <Box textAlign="center" width="100%">
            <Skeleton
              variant="text"
              width="40%"
              height={50}
              sx={{
                margin: "0 auto",
                fontSize: "2rem",
                bgcolor: "rgba(255, 255, 255, 0.08)",
              }}
            />
          </Box>

          {/* Adjacent camera/preset skeletons */}
          <Stack
            direction="row"
            spacing={4}
            justifyContent="space-between"
            width="100%"
            maxWidth="600px"
          >
            <Skeleton
              variant="text"
              width="25%"
              height={30}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.06)" }}
            />
            <Skeleton
              variant="text"
              width="25%"
              height={30}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.06)" }}
            />
          </Stack>
        </Box>
      );

    case "action-bar":
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton
            variant="rectangular"
            width={80}
            height={32}
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={80}
            height={32}
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="circular"
            width={32}
            height={32}
            animation="wave"
          />
        </Stack>
      );

    case "status-card":
      return (
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Skeleton variant="text" width="40%" height={32} animation="wave" />
            <Skeleton
              variant="circular"
              width={24}
              height={24}
              animation="wave"
            />
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Stack spacing={1}>
                <Skeleton
                  variant="text"
                  width="30%"
                  height={20}
                  animation="wave"
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height={32}
                  animation="wave"
                />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack spacing={1}>
                <Skeleton
                  variant="text"
                  width="30%"
                  height={20}
                  animation="wave"
                />
                <Skeleton
                  variant="text"
                  width="60%"
                  height={32}
                  animation="wave"
                />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      );

    case "camera-list":
      return (
        <Stack spacing={2}>
          {[1, 2, 3].map((item) => (
            <Box
              key={item}
              sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton
                    variant="circular"
                    width={24}
                    height={24}
                    animation="wave"
                  />
                  <Stack>
                    <Skeleton
                      variant="text"
                      width="120px"
                      height={24}
                      animation="wave"
                    />
                    <Skeleton
                      variant="text"
                      width="80px"
                      height={16}
                      animation="wave"
                    />
                  </Stack>
                </Stack>
                <Skeleton
                  variant="rectangular"
                  width={60}
                  height={24}
                  animation="wave"
                  sx={{ borderRadius: 3 }}
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      );

    case "camera-text-current":
      return (
        <Skeleton
          variant="text"
          width={width || "60%"}
          height={size === "large" ? 60 : size === "medium" ? 50 : 40}
          animation="wave"
          sx={{
            margin: "0 auto",
            fontSize:
              size === "large"
                ? "3.5rem"
                : size === "medium"
                ? "2.5rem"
                : "2rem",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            padding: "8px 16px",
          }}
        />
      );

    case "camera-text-adjacent":
      return (
        <Skeleton
          variant="text"
          width={width || "40%"}
          height={24}
          animation="wave"
          sx={{
            margin: "0 auto",
            bgcolor: "rgba(255, 255, 255, 0.06)",
            mb: 2,
            mt: 2,
          }}
        />
      );

    case "preset-text-current":
      return (
        <Skeleton
          variant="text"
          width={width || "50%"}
          height={size === "medium" ? 40 : 32}
          animation="wave"
          sx={{
            margin: "0 auto",
            fontSize: size === "medium" ? "2rem" : "1.5rem",
            bgcolor: "rgba(255, 255, 255, 0.08)",
            borderRadius: 1,
            padding: "4px 12px",
          }}
        />
      );

    case "preset-text-adjacent":
      return (
        <Skeleton
          variant="text"
          width={width || "30%"}
          height={20}
          animation="wave"
          sx={{
            margin: "0 auto",
            bgcolor: "rgba(255, 255, 255, 0.04)",
            fontSize: "0.9rem",
          }}
        />
      );

    default:
      return (
        <Skeleton
          variant="rectangular"
          width={width || "100%"}
          height={height || 40}
          animation="wave"
        />
      );
  }
};

export default SkeletonLoader;
