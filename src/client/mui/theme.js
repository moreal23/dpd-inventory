import { alpha, createTheme } from "@mui/material/styles";

const brandBlue = "#4ea1ff";

export function createAppTheme(mode = "dark") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: brandBlue },
      secondary: { main: "#ffb020" },
      success: { main: "#57d37c" },
      warning: { main: "#ffb547" },
      error: { main: "#ff6f7f" },
      background: {
        default: isDark ? "#091018" : "#eef4fb",
        paper: isDark ? "#121a24" : "#ffffff",
      },
      text: {
        primary: isDark ? "#eef4fb" : "#152235",
        secondary: isDark ? "#99a7ba" : "#55657c",
      },
    },
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily: '"Inter", sans-serif',
      h3: {
        fontFamily: '"Rajdhani", sans-serif',
        fontWeight: 700,
        letterSpacing: "0.04em",
      },
      h4: {
        fontFamily: '"Rajdhani", sans-serif',
        fontWeight: 700,
      },
      h5: {
        fontFamily: '"Rajdhani", sans-serif',
        fontWeight: 700,
      },
      h6: {
        fontWeight: 700,
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backdropFilter: "blur(18px)",
            backgroundColor: isDark ? alpha("#101722", 0.92) : alpha("#ffffff", 0.88),
            borderBottom: `1px solid ${isDark ? alpha("#ffffff", 0.08) : alpha("#0f1722", 0.08)}`,
            color: isDark ? "#eef4fb" : "#152235",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#0f1620" : "#f8fbff",
            borderRight: `1px solid ${isDark ? alpha("#ffffff", 0.08) : alpha("#0f1722", 0.08)}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${isDark ? alpha("#ffffff", 0.06) : alpha("#0f1722", 0.08)}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDark ? alpha("#ffffff", 0.08) : alpha("#0f1722", 0.08)}`,
          },
          head: {
            color: isDark ? "#99a7ba" : "#55657c",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
    },
  });
}

export default createAppTheme("dark");
