import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private verifyUrl(number: string): string {
    return `${this.config.get<string>('urls.web')}/verify?n=${number}`;
  }

  async listMine(userId: string) {
    const rows = await this.prisma.certificate.findMany({
      where: { userId, revokedAt: null },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        number: true,
        scorePct: true,
        issuedAt: true,
        pdfUrl: true,
        course: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    return rows.map((c) => ({
      id: c.id,
      number: c.number,
      courseTitle: c.course.title,
      recipientName: c.user.name,
      scorePct: c.scorePct,
      issuedAt: c.issuedAt,
      pdfUrl: c.pdfUrl,
      verifyUrl: this.verifyUrl(c.number),
    }));
  }

  /**
   * Verifikasi publik. Sengaja hanya mengembalikan data minimum
   * (nama penerima, kelas, skor) — tanpa email atau identitas lain.
   */
  async verify(number: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { number },
      select: {
        number: true,
        scorePct: true,
        issuedAt: true,
        revokedAt: true,
        course: { select: { title: true } },
        user: { select: { name: true } },
      },
    });
    if (!cert) throw new NotFoundException('certificate.notFound');

    return {
      valid: !cert.revokedAt,
      number: cert.number,
      recipientName: cert.user.name,
      courseTitle: cert.course.title,
      scorePct: cert.scorePct,
      issuedAt: cert.issuedAt,
      revokedAt: cert.revokedAt,
    };
  }
}
