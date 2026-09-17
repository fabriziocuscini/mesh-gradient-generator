import "@fontsource-variable/inter/wght.css";
import "@/styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "@/components/controls/color-mode";
import { TooltipProvider } from "@/components/ui/tooltip";
import { system } from "./theme";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        {/* Base UI keeps tooltip timing on the provider, not the root. */}
        <TooltipProvider delay={400} closeDelay={0}>
          <App />
        </TooltipProvider>
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>,
);
