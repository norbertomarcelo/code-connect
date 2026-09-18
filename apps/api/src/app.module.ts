import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { PostsModule } from './posts/posts.module.js';
import { TagsModule } from './tags/tags.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, TagsModule, PostsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
