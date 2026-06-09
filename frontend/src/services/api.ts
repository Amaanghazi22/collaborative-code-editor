import axios, { AxiosRequestConfig } from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_COLLAB_CODE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// add auth token automatically
API.interceptors.request.use((config) => {
  const user = localStorage.getItem("user");
  if (user) {
    const token = JSON.parse(user).token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

type HTTPMethod = "get" | "post" | "patch" | "delete";

interface RequestOptions extends AxiosRequestConfig {
  method: HTTPMethod;
  url: string;
  data?: any;
  params?: any;
}

export const apiRequest = async <T = any>({
  method,
  url,
  data,
  params,
  ...rest
}: RequestOptions): Promise<T> => {
  try {
    const response = await API.request<T>({
      method,
      url,
      data,
      params,
      ...rest,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data);
      return error.response?.data || { message: "Something went wrong" };
    } else {
      console.error("Unexpected Error:", error);
      throw { message: "Unexpected error occurred" };
    }
  }
};
