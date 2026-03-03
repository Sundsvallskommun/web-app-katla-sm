export interface AppConfig {
  applicationName: string;
  features: AppConfigFeatures;
}

interface AppConfigFeatures {
  reducedStakeholderInfo: boolean;
}

export const appConfig: AppConfig = {
  applicationName: process.env.NEXT_PUBLIC_APP_NAME || 'appen',
  features: {
    reducedStakeholderInfo: process.env.NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO === 'true',
  },
};