export interface SdkParams {
  appId?: string;
  url?: string;
  enableErrorLogging?: boolean;
}

export interface GetIntentParams extends SdkParams {
  redirectionURL?: string;
  orderId?: string;
  state?: string;
}

export interface HttpHandlerParams {
  url: string;
  options?: Object;
}

export interface LoggerParams {
  responseCode?: string | number;
  location?: string;
  message?: string;
}
