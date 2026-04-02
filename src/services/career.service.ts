import api, {Response} from '@/lib/api'

class CareerService {
  private static instance: CareerService;
  private basePath = '/academy/career';        //// No existe un basePath fijo ya que asi se definio las rutas del backend

  private constructor() {}

  public static getInstance(): CareerService {
    if (!CareerService.instance) {
      CareerService.instance = new CareerService();
    }
    return CareerService.instance;
  }

  async getSubjectsByCareer(idCareer:number): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/get/subjects/${idCareer}`);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

  async evalateHistory(payload:any): Promise<Response> {
    try {
      const response = await api.post(`${this.basePath}/evaluate`,payload);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }


}

export default CareerService.getInstance();