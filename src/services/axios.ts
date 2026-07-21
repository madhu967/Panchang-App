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

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: config?.headers,
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

      const data = await response.json();
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config?.headers || {}),
        },
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

      const resData = await response.json();
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
