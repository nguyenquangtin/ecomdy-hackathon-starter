import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VideoService {
  constructor(private http: HttpService) {}

  // Doc env trong runtime (sau khi ConfigModule load .env), khong phai luc import file
  private get base() {
    return process.env.ECOMDY_BASE_URL || 'https://api.ecomdy.co/v1';
  }
  private get auth() {
    return { Authorization: `Bearer ${process.env.ECOMDY_API_KEY}` };
  }

  // 1. Tao video - tra ve job_id ngay (status: pending)
  // Pass through full body (prompt + tuy chon image_url, engine, ...) de forward-compat voi Ecomdy
  // Ecomdy tra { job_id, status: "PENDING", ... } - normalize ve { id, status: "pending" }
  async generate(body: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${this.base}/video/generate`,
          body,
          { headers: this.auth },
        ),
      );
      const d = res.data.data ?? res.data;
      return { ...d, id: d.job_id ?? d.id, status: String(d.status || '').toLowerCase() };
    } catch (err) {
      this.rethrow(err, 'generate');
    }
  }

  // 2. Poll trang thai job - frontend goi moi 3 giay
  // Ecomdy tra { id, status: "COMPLETED"|"FAILED"|..., output_url, error, ... }
  async getJob(id: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.base}/jobs/${id}`, { headers: this.auth }),
      );
      const d = res.data.data ?? res.data;
      return { ...d, status: String(d.status || '').toLowerCase() };
    } catch (err) {
      this.rethrow(err, 'getJob');
    }
  }

  // Helper: re-throw axios error voi status code + message ro rang
  private rethrow(err: any, op: string): never {
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || `Error calling ${op}`;
    throw new HttpException({ op, message: msg }, status);
  }
}
