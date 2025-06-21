# Proposed Architecture Improvements

## Current Problems

1. **God Context**: AppContext exposes everything from useAppData
2. **Mixed Concerns**: Business logic mixed with state management
3. **Unnecessary Complexity**: Subscriber pattern for simple state updates
4. **Inconsistent Patterns**: Some hooks proxy to context, others contain logic

## Proposed Structure

### 1. Simplified Context (State Only)

```tsx
// contexts/AppContext.tsx
interface AppState {
  // Pure state - no business logic
  selectedCamera: string | null;
  allCameras: CameraInfo[];
  streamView: StreamView | undefined;
  cameraData: Record<string, CameraData>;
  isStreaming: boolean;
  streamURL: string | null;
  // ... other state
}

interface AppActions {
  // Simple state setters only
  setSelectedCamera: (camera: string | null) => void;
  setAllCameras: (cameras: CameraInfo[]) => void;
  setCameraData: (nickname: string, data: CameraData) => void;
  // ... other setters
}

const AppContext = createContext<(AppState & AppActions) | undefined>(
  undefined
);
```

### 2. Business Logic in Hooks

```tsx
// hooks/useCameraOperations.ts
export const useCameraOperations = () => {
  const { selectedCamera, setCameraData } = useAppContext();
  const api = useApi();
  const { showError, showSuccess } = useNotification();

  const loadCameraData = useCallback(
    async (nickname: string) => {
      // Business logic here
      const data = await api.getCameraStatus(nickname);
      setCameraData(nickname, data); // Simple state update
    },
    [api, setCameraData]
  );

  const gotoPreset = useCallback(
    async (nickname: string, presetToken: string) => {
      // Business logic here
      await api.gotoPreset(nickname, presetToken);
      showSuccess("Moved to preset");
    },
    [api, showSuccess]
  );

  return { loadCameraData, gotoPreset };
};
```

### 3. Simpler Component Usage

```tsx
// components/CameraControl.tsx
const CameraControl = () => {
  const { selectedCamera, cameraData } = useAppContext();
  const { loadCameraData, gotoPreset } = useCameraOperations();

  const currentCameraData = selectedCamera ? cameraData[selectedCamera] : null;

  // Component logic focused on UI concerns
  return (
    // JSX
  );
};
```

## Key Improvements

### 1. Clear Separation of Concerns

- **Context**: Only state and simple setters
- **Business Logic Hooks**: All API calls and complex operations
- **Components**: UI logic and user interactions

### 2. Simpler State Management

- Remove subscriber/notifier pattern
- Use direct state updates via context setters
- Let React handle re-renders naturally

### 3. Better Testability

- Business logic hooks can be tested independently
- Context becomes trivial to test (just state)
- Components test UI behavior, not business logic

### 4. Easier to Understand

- Clear data flow: Component → Hook → API → Context State → Component
- No complex subscription patterns to understand
- Each piece has a single responsibility

## Migration Strategy

1. **Extract State**: Move pure state to simplified context
2. **Move Business Logic**: Relocate all API calls and complex operations to dedicated hooks
3. **Simplify Components**: Remove business logic from components, use hooks instead
4. **Remove Subscribers**: Replace with direct state updates

This approach maintains the same functionality while being much easier to understand and maintain.
