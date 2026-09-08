'use client';

import { apiURL } from '@utils/api-url';
import { isProtectedPath } from '@utils/protected-routes';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
}

export const handleError = (error: AxiosError<ApiResponse>) => {
  if (
    typeof window === 'undefined' ||
    !isProtectedPath(window.location.pathname, {
      basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
      additionalRoutes: (process.env.NEXT_PUBLIC_PROTECTED_ROUTES ?? '').split(','),
    })
  )
    throw error;

  //TODO: Refactor to be more compliant with NextJS routing standards
  const applicationAccessDenied =
    error.response?.status === 403 && error.response.data?.message === 'KATLA_ACCESS_DENIED';
  if ((error?.response?.status === 401 || applicationAccessDenied) && !window?.location.pathname.includes('login')) {
    const loginUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`, window.location.origin);
    loginUrl.searchParams.set('path', `${window.location.pathname}${window.location.search}`);
    loginUrl.searchParams.set(
      'failMessage',
      applicationAccessDenied ? 'MISSING_PERMISSIONS' : (error.response?.data?.message ?? 'NOT_AUTHORIZED')
    );
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

const get = <T>(url: string, options?: AxiosRequestConfig) =>
  axios.get<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);

const post = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.post<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const remove = <T>(url: string, options?: AxiosRequestConfig) => {
  return axios.delete<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);
};

const patch = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.patch<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const put = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.put<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

export const apiService = { get, post, put, patch, delete: remove };
