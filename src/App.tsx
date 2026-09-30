import { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { muiThemeOptions } from './styles/mui.theme';
import { AppContextProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';

export function App() {
  const theme = useMemo(() => createTheme(muiThemeOptions), []);

  return (
    <ThemeProvider theme={theme}>
      <AppContextProvider>
        <AppShell />
      </AppContextProvider>
    </ThemeProvider>
  );
}

export default App;
