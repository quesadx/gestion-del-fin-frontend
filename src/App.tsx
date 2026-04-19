import { DeviceFrame, ScreenSurface, StatusBar } from "@/shared/ui/device";
import { AppRouter } from "@/app/AppRouter";

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
