import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { CertificatesService } from './certificates.service';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sertifikat milik saya' })
  listMine(@CurrentUser('id') userId: string) {
    return this.certificates.listMine(userId);
  }

  @Public()
  @Get('verify')
  @ApiQuery({ name: 'number', example: 'TC-2026-08421' })
  @ApiOperation({
    summary: 'Verifikasi keaslian sertifikat (publik)',
    description: 'Dipakai halaman /verify dan QR code pada sertifikat.',
  })
  verifyByQuery(@Query('number') number: string) {
    return this.certificates.verify(number);
  }

  @Public()
  @Get('verify/:number')
  @ApiOperation({ summary: 'Verifikasi sertifikat lewat path (publik)' })
  verify(@Param('number') number: string) {
    return this.certificates.verify(number);
  }
}
