import { createTheme } from "@mui/material";

export const theme = createTheme(({
  palette: {
    mode: 'dark',
    primary: {
      50: '#e1e3e5',
      100: '#b3b9be',
      200: '#818a93',
      300: '#4e5b67',
      400: '#283847',
      500: '#021526',
      600: '#021222',
      700: '#010f1c',
      800: '#010c17',
      900: '#01060d',
      A100: '#517aff',
      A200: '#1e53ff',
      A400: '#0037ea',
      A700: '#0031d0',
    },
    secondary: {
      50: '#edf0f1',
      100: '#d3d9dd',
      200: '#b6c0c6',
      300: '#99a6af',
      400: '#83939d',
      500: '#6d808c',
      600: '#657884',
      700: '#5a6d79',
      800: '#50636f',
      900: '#3e505c',
      A100: '#b4e1ff',
      A200: '#81cdff',
      A400: '#4eb8ff',
      A700: '#35aeff',
    },
    background: {
      paper: '#001625',
      default: "#000d19"
    },
  },

  components: {
    MuiTextField:{
      defaultProps:{
        variant:"standard"
      }
    },
    MuiButton: {
      defaultProps:{
        color: "secondary"
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        }
      }
    },
    MuiSelect: {
      defaultProps:{
        variant: 'standard',
      }
    },
    MuiInputLabel: {
      defaultProps:{
        variant: 'standard',
      }
    },
    MuiSwitch: {
      defaultProps:{
        color: "secondary"
      }
    },
    MuiCheckbox: {
      defaultProps:{
        color: "secondary"
      }
    },
  }
}));

export default theme;
