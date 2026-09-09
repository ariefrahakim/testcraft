import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [CmsModule, EnrollmentsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
