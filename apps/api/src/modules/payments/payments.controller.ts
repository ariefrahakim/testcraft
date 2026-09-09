import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CheckoutDto, PaymentQueryDto, WebhookDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Buat invoice pembelian kursus',
    description:
      'Harga, diskon kupon, dan pajak dihitung ulang di server — nilai dari klien diabaikan.',
  })
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.payments.checkout(userId, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Riwayat pembayaran saya' })
  listMine(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.payments.listMine(userId, query);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Semua transaksi (admin)' })
  listAll(@Query() query: PaymentQueryDto) {
    return this.payments.listAll(query, query.status);
  }

  @Public()
  @Post('webhook/midtrans')
  @ApiOperation({
    summary: 'Webhook notifikasi Midtrans',
    description:
      'Idempoten — pemanggilan berulang untuk invoice yang sama tidak menggandakan enrollment. ' +
      'Di produksi, verifikasi signature_key sebelum memproses.',
  })
  midtransWebhook(@Body() dto: WebhookDto) {
    const paidStatuses = ['settlement', 'capture', 'success'];
    if (dto.transactionStatus && !paidStatuses.includes(dto.transactionStatus)) {
      return { ok: true, ignored: true };
    }
    return this.payments.markPaid(dto.invoiceNo, dto.externalId, dto);
  }

  @Post('simulate-paid')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tandai invoice lunas (khusus development/QA)',
    description: 'Memicu alur yang sama dengan webhook: enrollment + notifikasi.',
  })
  simulatePaid(@Body() dto: WebhookDto) {
    return this.payments.markPaid(dto.invoiceNo, dto.externalId ?? 'SIMULATED');
  }
}
