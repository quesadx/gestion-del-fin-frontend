import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/app/AppRouter";
import { PipBoyRoom } from "@/shared/ui/pipboy";

function App() {
  return (
    <BrowserRouter>
      <PipBoyRoom>
        <AppRouter />
      </PipBoyRoom>
    </BrowserRouter>
  );
}

export default App;
