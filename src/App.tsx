import { DeviceFrame, ScreenSurface, StatusBar } from "@/shared/ui/device";
import { AppRouter } from "@/app/AppRouter";

/**
 * Root App Component
 *
 * Wraps the entire application with device chrome (bezel, screen, status bar)
 * and integrates the main router.
 */
function App() {
  return (
    <DeviceFrame>
      <ScreenSurface>
        <StatusBar />
        <AppRouter />
      </ScreenSurface>
    </DeviceFrame>
  );
}

export default App;
