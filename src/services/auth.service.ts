import api, {Response} from '@/lib/api'

class AuthService {
  private static instance: AuthService;
  private basePath = '/auth';

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(payload: any): Promise<Response> {
    try {
      const response = await api.post(`${this.basePath}/login`, payload);
      
      const authHeader = response.headers.authorization || response.headers.Authorization;
      
      if (response.status === 200 && authHeader) {
        const cleanToken = authHeader.replace('Bearer ', '');
        if (cleanToken && cleanToken.trim()) {
          localStorage.setItem("authToken", cleanToken);
          localStorage.setItem("authUser", JSON.stringify(response.data.data));
        } 
      }
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

  async register(payload: any): Promise<Response> {
    try {
      const response = await api.post(`${this.basePath}/register`, payload);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

  async verifyEmailCode(payload: any): Promise<Response> {
    try {
      const response = await api.post(`${this.basePath}/email/verify`, payload);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

  async resendEmailVerification(payload: any): Promise<Response> {
    try {
      const response = await api.post(`${this.basePath}/email/resend`, payload);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

}

export default AuthService.getInstance();