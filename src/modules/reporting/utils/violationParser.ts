// Standard IAPP violation parser matching official Johnson & Johnson specification

export interface ViolationItem {
  number: string;
  linkText: string;
  title: string;
  detail: string;
}

export interface ParsedViolations {
  mainText: string;
  hasViolations: boolean;
  subTitle: string;
  items: ViolationItem[];
}

export const DEFAULT_IAPP_VIOLATIONS: ViolationItem[] = [
  {
    number: '1',
    linkText: 'S-15 Section No. [2]',
    title: 'Security Assessment for COTS Systems/Applications',
    detail: 'Security assessment not completed for the environment',
  },
  {
    number: '2',
    linkText: 'S-15 Section No. [11]',
    title: 'ISRM Approval Prior to Production',
    detail: 'ISRM approval lacking due to missing assessment',
  },
  {
    number: '3',
    linkText: 'S-15 Section No. [4.18]',
    title: 'Periodic Application Architecture/Code/Config Assessment',
    detail: 'No periodic assessment of architecture, code, configuration',
  },
];

export const DEFAULT_IAPP_SUBTITLE = 'Non-Compliant with some of the sections of IAPP:';

export function parseDescriptionWithViolations(rawText: string = ''): ParsedViolations {
  if (!rawText) {
    return {
      mainText: '',
      hasViolations: false,
      subTitle: '',
      items: [],
    };
  }

  // Check if text already contains "Violation Reference"
  if (rawText.includes('Violation Reference')) {
    const parts = rawText.split('Violation Reference');
    const mainText = parts[0].trim();
    return {
      mainText,
      hasViolations: true,
      subTitle: DEFAULT_IAPP_SUBTITLE,
      items: DEFAULT_IAPP_VIOLATIONS,
    };
  }

  return {
    mainText: rawText,
    hasViolations: true,
    subTitle: DEFAULT_IAPP_SUBTITLE,
    items: DEFAULT_IAPP_VIOLATIONS,
  };
}
