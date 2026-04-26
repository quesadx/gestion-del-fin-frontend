import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/app/AppRouter";
import { DeviceFrame, ScreenSurface } from "@/shared/ui/device";

function App() {
  return (
    <BrowserRouter>
      <DeviceFrame>
        <ScreenSurface>
          <AppRouter />
        </ScreenSurface>
      </DeviceFrame>
    </BrowserRouter>
  );
}

export default App;
