import "@fontsource-variable/inter/wght.css";
import "@/styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/controls/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      {/* Base UI keeps tooltip timing on the provider, not the root. */}
      <TooltipProvider delay={400} closeDelay={0}>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
