export interface SdkParams {
  appId?: string;
  url?: string;
  enableErrorLogging?: boolean;
}

export interface GetIntentParams {
  redirectionURL?: string;
  orderId?: string;
}

export interface LoggerParams {
  responseCode?: string | number;
  location?: string;
  message?: string;
}
