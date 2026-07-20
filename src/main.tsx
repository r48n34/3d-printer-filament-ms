import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const theme = createTheme({
  primaryColor: "copper",
  primaryShade: 7,
  colors: {
    copper: [
      "#fff4ed",
      "#ffe5d4",
      "#ffc7a8",
      "#fda576",
      "#f58649",
      "#e86f2e",
      "#d65e22",
      "#b6491b",
      "#923b1c",
      "#76331b",
    ],
  },
  defaultRadius: "md",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: "750",
  },
  components: {
    Button: { defaultProps: { radius: "md" } },
    Card: { defaultProps: { shadow: "xs" } },
    Modal: { defaultProps: { radius: "lg", overlayProps: { backgroundOpacity: 0.4, blur: 2 } } },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <ModalsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>,
);
