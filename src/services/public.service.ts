import api, {Response} from '@/lib/api'

class PublicService {
  private static instance: PublicService;
  private basePath = '/public';

  private constructor() {}

  public static getInstance(): PublicService {
    if (!PublicService.instance) {
      PublicService.instance = new PublicService();
    }
    return PublicService.instance;
  }

  async getCareersForRegistration(): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/get/careers`);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

}

export default PublicService.getInstance();