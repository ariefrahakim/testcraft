import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import {
  LearningPathsController,
  LearningPathsService,
} from './learning-paths.controller';

@Module({
  controllers: [CoursesController, CategoriesController, LearningPathsController],
  providers: [CoursesService, CategoriesService, LearningPathsService],
  exports: [CoursesService],
})
export class CoursesModule {}
