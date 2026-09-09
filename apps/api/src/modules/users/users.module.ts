import { Module } from '@nestjs/common';
import { InstructorsController, UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, InstructorsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
