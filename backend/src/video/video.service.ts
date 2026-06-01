import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private http: HttpService,
    private prisma: PrismaService,
  ) {}

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
      const job = { ...d, id: d.job_id ?? d.id, status: String(d.status || '').toLowerCase() };

      // Log job vao DB (best-effort: loi DB khong duoc lam vo flow generate)
      await this.logCreate(job.id, body, job.status);
      return job;
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
      const job = { ...d, status: String(d.status || '').toLowerCase() };

      // Cap nhat trang thai + output vao DB (best-effort)
      await this.logUpdate(id, job);
      return job;
    } catch (err) {
      this.rethrow(err, 'getJob');
    }
  }

  // List 50 job moi nhat cho History panel
  listJobs() {
    return this.prisma.videoJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // --- DB helpers (best-effort: chi log warning khi loi, khong throw) ---

  private async logCreate(id: string, body: Record<string, any>, status: string) {
    try {
      await this.prisma.videoJob.create({
        data: { id, prompt: body.prompt, imageUrl: body.image_url ?? null, status },
      });
    } catch (e: any) {
      this.logger.warn(`logCreate failed for ${id}: ${e.message}`);
    }
  }

  private async logUpdate(id: string, job: Record<string, any>) {
    const data = {
      status: job.status,
      outputUrl: job.output_url ?? null,
      // Spec: failed VideoJob carries flat `error_message`; keep legacy shapes as fallback
      error: job.error_message ?? job.error?.message ?? (typeof job.error === 'string' ? job.error : null),
    };
    try {
      // upsert: phong khi row chua ton tai (vd backend restart giua chung)
      await this.prisma.videoJob.upsert({
        where: { id },
        update: data,
        create: { id, prompt: job.prompt ?? '', ...data },
      });
    } catch (e: any) {
      this.logger.warn(`logUpdate failed for ${id}: ${e.message}`);
    }
  }

  // Helper: re-throw axios error voi status code + message ro rang
  private rethrow(err: any, op: string): never {
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || `Error calling ${op}`;
    throw new HttpException({ op, message: msg }, status);
  }
}
