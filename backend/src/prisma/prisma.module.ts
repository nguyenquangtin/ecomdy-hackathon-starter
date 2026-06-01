import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: cac module khac inject PrismaService ma khong can import lai
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
