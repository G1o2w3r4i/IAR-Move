import { createTheme, type ThemeOptions } from '@mui/material/styles';

const jjBrandColors = {
	red: '#eb1700',
	blue: '#000099',
	black: '#212121',
	grey: '#888b8d',
	greyLight: '#d8d8d8',
	greyExtraLight: '#f4f4f4',
};

const commonColors = {
	black: '#000000',
	greyVeryLight: '#fafafc',
	greyExtraLight: '#f4f4f6',
	white: '#ffffff',
	blueLight: '#f1f4ff',
	blueBright: '#0e65e8',
};

export const muiThemeOptions: ThemeOptions = {
	palette: {
		primary: {
			dark: jjBrandColors.black,
			main: jjBrandColors.blue,
		},
		secondary: {
			main: jjBrandColors.red,
		},
		info: {
			main: commonColors.blueBright,
		},
		background: {
			default: commonColors.white,
		},
	},
	typography: {
		fontFamily: ['jj-circular', 'Arial', 'Helvetica', 'sans-serif'].join(', '),
		fontWeightRegular: 400,
		fontWeightMedium: 900,
	},
	components: {
		MuiDivider: {
			styleOverrides: {
				root: {
					borderColor: jjBrandColors.greyLight, // #d8d8d8
					borderBottomWidth: '1px',
				},
			},
		},
		MuiTabs: {
			styleOverrides: {
				indicator: {
					backgroundColor: jjBrandColors.blue, // #000099 Primary Blue
					height: '3px',
					borderRadius: '2px 2px 0 0',
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
					textTransform: 'none',
					'&.Mui-selected': {
						color: jjBrandColors.blue, // #000099 Primary Blue
					},
					'&:hover': {
						color: jjBrandColors.blue,
					},
				},
			},
		},
		MuiAccordion: {
			defaultProps: { elevation: 0 },
		},
		MuiButton: {
			styleOverrides: {
				root: { textTransform: 'none' },
			},
			variants: [
				{
					props: { variant: 'text' },
					style: { color: commonColors.blueBright, textTransform: 'none', fontWeight: 400 },
				},
				{
					props: { variant: 'outlined', color: 'secondary' },
					style: {
						color: jjBrandColors.black,
						backgroundColor: commonColors.white,
						borderColor: jjBrandColors.red,
						textTransform: 'none',
						minWidth: '8rem',
						'&:hover': { backgroundColor: commonColors.greyVeryLight },
					},
				},
				{
					props: { variant: 'contained' },
					style: { textTransform: 'none' },
				},
			],
		},
		MuiFormControl: {
			defaultProps: { variant: 'standard' },
		},
		MuiSelect: {
			styleOverrides: {
				standard: {
					'& .MuiInputBase-input': { paddingLeft: '0.5rem' },
					'& .MuiSvgIcon-root': { color: jjBrandColors.red },
				},
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					'&.Mui-selected': { backgroundColor: commonColors.blueLight },
					'&.Mui-selected:hover': { backgroundColor: commonColors.blueLight },
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				head: { color: jjBrandColors.grey },
				body: { color: 'currentColor' },
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					paddingTop: '2px',
					borderRadius: 0,
					marginLeft: '0.25rem',
					marginRight: '0.25rem',
					backgroundColor: commonColors.white,
					borderColor: jjBrandColors.grey,
				},
			},
		},
		MuiAutocomplete: {
			styleOverrides: {
				root: {
					'& .MuiAutocomplete-endAdornment .MuiSvgIcon-root': { color: jjBrandColors.red },
				},
			},
		},
		MuiRadio: {
			styleOverrides: {
				root: {
					'&.Mui-checked': { color: jjBrandColors.red },
				},
			},
		},
		MuiSlider: {
			styleOverrides: {
				root: {
					'& .MuiSlider-rail': { backgroundColor: jjBrandColors.greyLight },
					'& .MuiSlider-thumb': {
						borderRadius: '1px',
						height: '1rem',
						width: '0.65rem',
					},
				},
			},
		},
	},
};

export const muiTheme = createTheme(muiThemeOptions);
