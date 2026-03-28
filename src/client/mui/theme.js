import { alpha, createTheme } from "@mui/material/styles";

const brandBlue = "#4ea1ff";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: brandBlue },
    secondary: { main: "#ffb020" },
    success: { main: "#57d37c" },
    warning: { main: "#ffb547" },
    error: { main: "#ff6f7f" },
    background: {
      default: "#091018",
      paper: "#121a24",
    },
    text: {
      primary: "#eef4fb",
      secondary: "#99a7ba",
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
          backgroundColor: alpha("#101722", 0.92),
          borderBottom: `1px solid ${alpha("#ffffff", 0.08)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#0f1620",
          borderRight: `1px solid ${alpha("#ffffff", 0.08)}`,
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
          border: `1px solid ${alpha("#ffffff", 0.06)}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha("#ffffff", 0.08)}`,
        },
        head: {
          color: "#99a7ba",
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

export default theme;
