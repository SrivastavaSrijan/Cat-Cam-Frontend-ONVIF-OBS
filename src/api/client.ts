import {
  API_BASE_URL,
  MJPEG_BASE_URL,
  CAMERA_ENDPOINTS,
  OBS_ENDPOINTS,
  MJPEG_ENDPOINTS,
} from "../config";
import type {
  ApiResponse,
  ApiError,
  ApiClientConfig,
  RequestOptions,
  MovementDirection,
  // Camera types
  CameraStatus,
  CameraInfo,
  Preset,
  ImagingSettings,
  SwitchCameraRequest,
  GotoPresetRequest,
  MoveRequest,
  ContinuousMoveRequest,
  MovementSpeedRequest,
  NightModeRequest,
  // OBS types
  Scene,
  CurrentScene,
  TransformationState,
  VirtualCameraStatus,
  SwitchSceneRequest,
  TransformRequest,
  StartProjectorRequest,
  CloseProjectorRequest,
  // MJPEG types
  MjpegStreamStatus,
  MjpegHealthStatus,
} from "../types/api";

// ============================================================================
// Core API Client Class
// ============================================================================

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: API_BASE_URL,
      mjpegBaseUrl: MJPEG_BASE_URL,
      timeout: 10000,
      retries: 1,
      retryDelay: 1000,
      ...config,
    };
  }

  private async request<T>(
    url: string,
    method: "GET" | "POST" = "GET",
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      retryDelay = this.config.retryDelay,
      signal,
    } = options;

    const executeRequest = async (attempt: number): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        // Add cache-busting headers in development mode
        if (process.env.NODE_ENV === "development") {
          headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
          headers.Pragma = "no-cache";
          headers.Expires = "0";
        }

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: ApiError;

          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
              message: errorText,
              status: response.status,
            };
          }

          throw new ApiClientError(errorData.error, response.status, errorData);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        if (attempt < (retries || 1) && !(error instanceof ApiClientError)) {
          console.warn(
            `Request failed (attempt ${attempt}/${retries}), retrying...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return executeRequest(attempt + 1);
        }

        throw error;
      }
    };

    return executeRequest(1);
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }
    }
    return url.toString();
  }

  private buildMjpegUrl(endpoint: string): string {
    return `${this.config.mjpegBaseUrl}${endpoint}`;
  }

  // ============================================================================
  // Camera API Methods
  // ============================================================================

  async getCameraStatus(
    nickname: string,
    options?: RequestOptions
  ): Promise<CameraStatus> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.STATUS, { nickname });
    const response = await this.request<ApiResponse<CameraStatus>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data || (response as CameraStatus);
  }

  async getAllCameras(options?: RequestOptions): Promise<CameraInfo[]> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.CAMERAS);
    const response = await this.request<ApiResponse<{ cameras: CameraInfo[] }>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data?.cameras || [];
  }

  async getCameraPresets(
    nickname: string,
    options?: RequestOptions
  ): Promise<Preset[]> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.PRESETS, { nickname });
    const response = await this.request<ApiResponse<{ presets: Preset[] }>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data?.presets || [];
  }

  async getCameraImaging(
    nickname: string,
    options?: RequestOptions
  ): Promise<ImagingSettings> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.IMAGING, { nickname });
    const response = await this.request<ApiResponse<ImagingSettings>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data || (response as ImagingSettings);
  }

  async switchCamera(
    nickname: string,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.SWITCH_CAMERA);
    const body: SwitchCameraRequest = { nickname };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async gotoPreset(
    nickname: string,
    presetToken: string,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.GOTO_PRESET, { nickname });
    const body: GotoPresetRequest = { presetToken };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async moveCamera(
    nickname: string,
    direction: MovementDirection,
    velocityFactor?: number,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.MOVE, { nickname });
    const body: MoveRequest = {
      direction,
      velocity_factor: velocityFactor,
    };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async continuousMove(
    nickname: string,
    direction: MovementDirection,
    speed?: number,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.CONTINUOUS_MOVE, { nickname });
    const body: ContinuousMoveRequest = {
      direction,
      speed,
    };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async stopMove(nickname: string, options?: RequestOptions): Promise<void> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.STOP, { nickname });
    await this.request<ApiResponse>(url, "POST", undefined, options);
  }

  async setMovementSpeed(
    nickname: string,
    panTiltSpeed?: number,
    zoomSpeed?: number,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.MOVEMENT_SPEED, { nickname });
    const body: MovementSpeedRequest = {
      pan_tilt_speed: panTiltSpeed,
      zoom_speed: zoomSpeed,
    };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async toggleNightMode(
    nickname: string,
    enable: boolean,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.NIGHT_MODE, { nickname });
    const body: NightModeRequest = { enable };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async reinitializeCameras(options?: RequestOptions): Promise<CameraInfo[]> {
    const url = this.buildUrl(CAMERA_ENDPOINTS.REINITIALIZE);
    return this.request<CameraInfo[]>(url, "POST", undefined, options);
  }

  // ============================================================================
  // OBS API Methods
  // ============================================================================

  async getScenes(options?: RequestOptions): Promise<Scene[]> {
    const url = this.buildUrl(OBS_ENDPOINTS.SCENES);
    const response = await this.request<ApiResponse<{ scenes: Scene[] }>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data?.scenes || [];
  }

  async getCurrentScene(options?: RequestOptions): Promise<CurrentScene> {
    const url = this.buildUrl(OBS_ENDPOINTS.CURRENT_SCENE);
    const response = await this.request<ApiResponse<CurrentScene>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data || (response as CurrentScene);
  }

  async switchScene(
    sceneName: string,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(OBS_ENDPOINTS.SWITCH_SCENE);
    const body: SwitchSceneRequest = { scene_name: sceneName };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async getTransformationState(
    options?: RequestOptions
  ): Promise<TransformationState> {
    const url = this.buildUrl(OBS_ENDPOINTS.CURRENT_TRANSFORMATION);
    const response = await this.request<ApiResponse<TransformationState>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data || (response as TransformationState);
  }

  async applyTransformation(
    type: "grid" | "highlight",
    activeSource?: string,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(OBS_ENDPOINTS.TRANSFORM);
    const body: TransformRequest = { type, active_source: activeSource };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async reconnectOBS(options?: RequestOptions): Promise<void> {
    const url = this.buildUrl(OBS_ENDPOINTS.RECONNECT);
    await this.request<ApiResponse>(url, "POST", undefined, options);
  }

  async startVirtualCamera(options?: RequestOptions): Promise<void> {
    const url = this.buildUrl(OBS_ENDPOINTS.VIRTUAL_CAMERA.START);
    await this.request<ApiResponse>(url, "POST", undefined, options);
  }

  async stopVirtualCamera(options?: RequestOptions): Promise<void> {
    const url = this.buildUrl(OBS_ENDPOINTS.VIRTUAL_CAMERA.STOP);
    await this.request<ApiResponse>(url, "POST", undefined, options);
  }

  async getVirtualCameraStatus(
    options?: RequestOptions
  ): Promise<VirtualCameraStatus> {
    const url = this.buildUrl(OBS_ENDPOINTS.VIRTUAL_CAMERA.STATUS);
    const response = await this.request<ApiResponse<VirtualCameraStatus>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data || (response as VirtualCameraStatus);
  }

  async startProjector(
    sourceName: string,
    monitorIndex?: number,
    options?: RequestOptions
  ): Promise<void> {
    const url = this.buildUrl(OBS_ENDPOINTS.PROJECTOR.START);
    const body: StartProjectorRequest = {
      source_name: sourceName,
      monitor_index: monitorIndex,
    };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  async closeProjector(options?: RequestOptions): Promise<void> {
    const url = this.buildUrl(OBS_ENDPOINTS.PROJECTOR.CLOSE);
    const body: CloseProjectorRequest = { projector_type: "source" };
    await this.request<ApiResponse>(url, "POST", body, options);
  }

  // ============================================================================
  // MJPEG Stream API Methods
  // ============================================================================

  async getMjpegHealth(options?: RequestOptions): Promise<MjpegHealthStatus> {
    const url = this.buildMjpegUrl(MJPEG_ENDPOINTS.HEALTH);
    const response = await this.request<ApiResponse<MjpegHealthStatus>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data || (response as MjpegHealthStatus);
  }

  async getMjpegStatus(options?: RequestOptions): Promise<MjpegStreamStatus> {
    const url = this.buildMjpegUrl(MJPEG_ENDPOINTS.STATUS);
    const response = await this.request<ApiResponse<MjpegStreamStatus>>(
      url,
      "GET",
      undefined,
      options
    );
    return response.data || (response as MjpegStreamStatus);
  }

  async startMjpegStream(options?: RequestOptions): Promise<void> {
    const url = this.buildMjpegUrl(MJPEG_ENDPOINTS.START);
    await this.request<ApiResponse>(url, "POST", undefined, options);
  }

  async stopMjpegStream(options?: RequestOptions): Promise<void> {
    const url = this.buildMjpegUrl(MJPEG_ENDPOINTS.STOP);
    await this.request<ApiResponse>(url, "POST", undefined, options);
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class ApiClientError extends Error {
  public readonly status?: number;
  public readonly data?: ApiError;

  constructor(message: string, status?: number, data?: ApiError) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }

  public isNetworkError(): boolean {
    return !this.status || this.status >= 500;
  }

  public isClientError(): boolean {
    return !!this.status && this.status >= 400 && this.status < 500;
  }
}

// ============================================================================
// Default Client Instance
// ============================================================================

export const apiClient = new ApiClient();

// Export types for use in hooks and components
export type { RequestOptions };
