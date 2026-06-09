import { apiRequest } from "./api.ts";
import { LoginT, SignUpT } from "./apiTypes.ts";

export const signupUser = (data: SignUpT) =>
  apiRequest({ method: "post", url: "api/auth/signup", data });

export const userLogin = (data: LoginT) =>
  apiRequest({ method: "post", url: "api/auth/login", data });
