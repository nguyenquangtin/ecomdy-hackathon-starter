import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const BASE = process.env.ECOMDY_BASE_URL || 'https://api.ecomdy.co/v1';
const AUTH = { Authorization: `Bearer ${process.env.ECOMDY_API_KEY}` };

@Injectable()
export class VideoService {
  constructor(private http: HttpService) {}

  // 1. Tao video - tra ve job_id ngay (status: pending)
  async generate(prompt: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${BASE}/video/generate`,
          { prompt },
          { headers: AUTH },
        ),
      );
      return res.data.data; // { id, status }
    } catch (err) {
      this.rethrow(err, 'generate');
    }
  }

  // 2. Poll trang thai job - frontend goi moi 3 giay
  async getJob(id: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${BASE}/jobs/${id}`, { headers: AUTH }),
      );
      return res.data.data; // { id, status, output_url }
    } catch (err) {
      this.rethrow(err, 'getJob');
    }
  }

  // Helper: re-throw axios error voi status code + message ro rang
  private rethrow(err: any, op: string): never {
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || `Loi khi goi ${op}`;
    throw new HttpException({ op, message: msg }, status);
  }
}
