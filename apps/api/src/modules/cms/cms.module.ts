import { Module } from '@nestjs/common';
import { AssignmentsController, AssignmentsService } from './assignments.controller';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { PublicContentController } from './public-content.controller';

@Module({
  controllers: [CmsController, PublicContentController, AssignmentsController],
  providers: [CmsService, AssignmentsService],
  exports: [CmsService],
})
export class CmsModule {}
