import { ENV } from '@/config/env';

export const apiBaseUrl = ENV.API_URL;

export const isMockApi = apiBaseUrl.length === 0;
