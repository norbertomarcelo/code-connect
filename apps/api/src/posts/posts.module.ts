import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TagsModule } from '../tags/tags.module.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';

@Module({
  imports: [AuthModule, TagsModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
