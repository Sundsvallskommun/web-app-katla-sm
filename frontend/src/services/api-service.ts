'use client';

import { apiURL } from '@utils/api-url';
import { protectedRoutes } from '@utils/protected-routes';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
}

export const handleError = (error: AxiosError<ApiResponse>) => {
  if (!protectedRoutes.includes(window?.location.pathname)) throw error;

  //TODO: Refactor to be more compliant with NextJS routing standards
  if (error?.response?.status === 401 && !window?.location.pathname.includes('login')) {
    const loginUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`, window.location.origin);
    loginUrl.searchParams.set('path', window.location.pathname);
    loginUrl.searchParams.set('failMessage', error.response.data.message);
    window.location.assign(loginUrl);
  }

  throw error;
};

const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

/** Den användarhandling som pågår, medan en gör det; se `withRequestGroup`. */
let actionRequestGroupId: string | undefined;

/**
 * Kör en användarhandling så att varje anrop den gör bär samma `X-Request-Group-Id`.
 *
 * SupportManagement samlar händelserna från en handling, till exempel ett nytt samtal och meddelandet
 * i det, i en notis till den som följer ärendet i stället för en per anrop. En handling som startas
 * inne i en annan går in i den yttre. Ett anrop något annat gör medan handlingen pågår, som
 * notislistans hämtning, får också id:t; läsningar ger inga händelser, så det gör ingen skada.
 */
export const withRequestGroup = async <T>(action: () => Promise<T>): Promise<T> => {
  if (actionRequestGroupId) return action();
  actionRequestGroupId = crypto.randomUUID();
  try {
    return await action();
  } finally {
    actionRequestGroupId = undefined;
  }
};

/**
 * Anroparens inställningar. Headers anges som ett vanligt objekt, så att de kan läggas ovanpå
 * standardinställningarna.
 */
type RequestOptions = Omit<AxiosRequestConfig, 'headers'> & { headers?: Record<string, string> };

/** Standardinställningarna och den pågående handlingens grupp, med anroparens egna headers sist. */
const withDefaults = (options?: RequestOptions): AxiosRequestConfig => ({
  ...defaultOptions,
  ...options,
  headers: {
    ...defaultOptions.headers,
    ...(actionRequestGroupId ? { 'X-Request-Group-Id': actionRequestGroupId } : {}),
    ...options?.headers,
  },
});

const get = <T>(url: string, options?: RequestOptions) =>
  axios.get<T>(apiURL(url), withDefaults(options)).catch(handleError);

const post = <T>(url: string, data: unknown, options?: RequestOptions) => {
  return axios.post<T>(apiURL(url), data, withDefaults(options)).catch(handleError);
};

const remove = <T>(url: string, options?: RequestOptions) => {
  return axios.delete<T>(apiURL(url), withDefaults(options)).catch(handleError);
};

const patch = <T>(url: string, data: unknown, options?: RequestOptions) => {
  return axios.patch<T>(apiURL(url), data, withDefaults(options)).catch(handleError);
};

const put = <T>(url: string, data: unknown, options?: RequestOptions) => {
  return axios.put<T>(apiURL(url), data, withDefaults(options)).catch(handleError);
};

export const apiService = { get, post, put, patch, delete: remove };
