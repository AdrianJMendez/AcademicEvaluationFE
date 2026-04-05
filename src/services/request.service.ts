import api, { Response } from '@/lib/api';
import type {
  EmployeeRequestListParams,
  EmployeeRequestStatusName,
  ReviewJustificationPayload,
} from '@/types/request';

class RequestService {
  private static instance: RequestService;
  private basePath = '/request';

  private constructor() {}

  public static getInstance(): RequestService {
    if (!RequestService.instance) {
      RequestService.instance = new RequestService();
    }
    return RequestService.instance;
  }

  async getEmployeeCounts(): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/employee/get/count`);
      return response.data;
    } catch (error: any) {
      console.log('error: ', error);
      return error.response?.data;
    }
  }

  async getEmployeeRequestsByStatus(
    statusName: EmployeeRequestStatusName,
    params?: EmployeeRequestListParams,
  ): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/employee/get/status/${statusName}`, {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.log('error: ', error);
      return error.response?.data;
    }
  }

  async getEmployeeRequestDetail(idRequest: number | string): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/employee/get/detail/${idRequest}`);
      return response.data;
    } catch (error: any) {
      console.log('error: ', error);
      return error.response?.data;
    }
  }

  async getEmployeeRequestImages(idRequest: number | string): Promise<Response> {
    try {
      const response = await api.get(`${this.basePath}/employee/get/images/${idRequest}`);
      return response.data;
    } catch (error: any) {
      console.log('error: ', error);
      return error.response?.data;
    }
  }

  async generateEmployeeRequestReport(idRequest: number | string): Promise<Response> {
    try {
      const response = await api.post(`${this.basePath}/employee/report/${idRequest}`);
      return response.data;
    } catch (error: any) {
      console.log('error: ', error);
      return error.response?.data;
    }
  }

  async downloadEmployeeRequestReport(
    idRequest: number | string,
  ): Promise<
    | { hasError: false; blob: Blob; fileName: string }
    | { hasError: true; message: string }
  > {
    try {
      const response = await api.get(`${this.basePath}/employee/report/${idRequest}/download`, {
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'] ?? '';

      if (contentType.includes('application/json')) {
        const text = await response.data.text();
        const parsed = JSON.parse(text);
        return {
          hasError: true,
          message: parsed?.meta?.message ?? 'No se pudo descargar el informe.',
        };
      }

      const disposition = response.headers['content-disposition'] ?? '';
      const fileNameMatch = disposition.match(/filename="(.+)"/i);

      return {
        hasError: false,
        blob: response.data,
        fileName: fileNameMatch?.[1] ?? `solicitud-${idRequest}-informe.pdf`,
      };
    } catch (error: any) {
      console.log('error: ', error);
      return {
        hasError: true,
        message: 'No se pudo descargar el informe.',
      };
    }
  }

  async takeEmployeeRequest(idRequest: number | string): Promise<Response> {
    try {
      const response = await api.patch(`${this.basePath}/employee/take/${idRequest}`);
      return response.data;
    } catch (error: any) {
      console.log('error: ', error);
      return error.response?.data;
    }
  }

  async finishEmployeeReview(
    idRequest: number | string,
    justifications: ReviewJustificationPayload[],
    notes?: string,
  ): Promise<Response> {
    try {
      const response = await api.patch(`${this.basePath}/employee/review/${idRequest}`, {
        justifications,
        notes,
      });
      return response.data;
    } catch (error: any) {
      console.log('error: ', error);
      return error.response?.data;
    }
  }

  async createRequest(payload:any): Promise<Response> {
    try {
      const response = await api.post(`${this.basePath}/`, payload);
      
      return response.data;

    } catch (error: any) {
      console.log("error: ", error);
      return error.response?.data;
    }
  }
}

export default RequestService.getInstance();
