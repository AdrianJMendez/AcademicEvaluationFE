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
}

export default RequestService.getInstance();
