import api, {Response} from '@/lib/api'

class StudentService {
  private static instance: StudentService;
  private basePath = '';        //// No existe un basePath fijo ya que asi se definio las rutas del backend

  private constructor() {}

  public static getInstance(): StudentService {
    if (!StudentService.instance) {
      StudentService.instance = new StudentService();
    }
    return StudentService.instance;
  }

  async getCareersForStudent(): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/academy/career/student/get`);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

    async getRequestCountForStudent(): Promise<Response> {
        try {
        const response = await api.get(`${this.basePath}/request/student/get/count`);
        
        return response.data;

        } catch (error: any) {
        console.log("error: ", error);
        return error.response?.data;
        }
    }

  async getRequestByStatusAndCareerForStudent(
    idStatus:number,
    idCareer: number,
    page: number,
    size: number, 
    sort: number
  ): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/request/student/get/status/${idStatus}/career/${idCareer}/${page}/${size}/${sort}`);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }

}

export default StudentService.getInstance();