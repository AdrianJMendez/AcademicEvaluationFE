import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export interface Response {
    data: any,
    meta: {
        status: number,
        message: string
    },
    hasError: boolean
}

//export const API_BASE_URL = 'http://localhost:3000';
export const API_BASE_URL = 'https://academicevaluation.mooo.com';

const api = axios.create({  
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true
});

// Fix: Use InternalAxiosRequestConfig for request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Fix: Properly type the response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if(response.status === 401){
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
