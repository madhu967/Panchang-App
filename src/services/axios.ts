export interface AxiosRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
}

const axios = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const controller = new AbortController();
    const timeoutId = config?.timeout ? setTimeout(() => controller.abort(), config.timeout) : null;

    // Set up headers and automatically inject x-api-key for VedAstro requests if available
    const requestHeaders: Record<string, string> = { ...(config?.headers || {}) };
    if (url.includes('vedastro.org') && process.env.EXPO_PUBLIC_VEDASTRO_API_KEY) {
      requestHeaders['x-api-key'] = process.env.EXPO_PUBLIC_VEDASTRO_API_KEY;
    }
    if (url.includes('api.navamsha.in')) {
      const apiKey = process.env.EXPO_PUBLIC_NAVAMSHA_API_KEY;
      if (apiKey) {
        requestHeaders['X-API-Key'] = apiKey;
      }
      requestHeaders['Accept'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        const err: any = new Error(`Request failed with status code ${response.status}`);
        err.response = { status: response.status, data: errorData };
        throw err;
      }

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: config || {},
      };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    }
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const controller = new AbortController();
    const timeoutId = config?.timeout ? setTimeout(() => controller.abort(), config.timeout) : null;

    // Set up headers and automatically inject x-api-key for VedAstro requests if available
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers || {}),
    };
    if (url.includes('vedastro.org') && process.env.EXPO_PUBLIC_VEDASTRO_API_KEY) {
      requestHeaders['x-api-key'] = process.env.EXPO_PUBLIC_VEDASTRO_API_KEY;
    }
    if (url.includes('api.navamsha.in')) {
      const apiKey = process.env.EXPO_PUBLIC_NAVAMSHA_API_KEY;
      if (apiKey) {
        requestHeaders['X-API-Key'] = apiKey;
      }
      requestHeaders['Accept'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        const err: any = new Error(`Request failed with status code ${response.status}`);
        err.response = { status: response.status, data: errorData };
        throw err;
      }

      const responseText = await response.text();
      let resData: any;
      try {
        resData = JSON.parse(responseText);
      } catch {
        resData = responseText;
      }

      return {
        data: resData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: config || {},
      };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    }
  },
};

export default axios;
