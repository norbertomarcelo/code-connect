import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { ListPostsQueryDto } from './dto/list-posts-query.dto.js';
import {
  PaginatedPostsResponseDto,
  PostDetailResponseDto,
  PostLikeResponseDto,
} from './dto/post-response.dto.js';
import { toPostDetailDto, toPostSummaryDto } from './post.mapper.js';
import { PostsService } from './posts.service.js';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List posts with full-text search and tag filters',
  })
  @ApiOkResponse({ type: PaginatedPostsResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Invalid query' })
  async list(
    @Query() query: ListPostsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<PaginatedPostsResponseDto> {
    const { items, total } = await this.postsService.list({
      q: query.q?.trim() || undefined,
      tagSlugs: query.tags ?? [],
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      viewerId: viewer?.id,
    });

    return {
      items: items.map(toPostSummaryDto),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a post' })
  @ApiOkResponse({ type: PostDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Malformed id' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<PostDetailResponseDto> {
    return toPostDetailDto(await this.postsService.findOne(id, viewer?.id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a post' })
  @ApiCreatedResponse({ type: PostDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PostDetailResponseDto> {
    const post = await this.postsService.create(user.id, dto);
    response.setHeader('Location', `/posts/${post.id}`);
    return toPostDetailDto(post);
  }

  @Post(':id/likes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a post as the current user' })
  @ApiCreatedResponse({ type: PostLikeResponseDto })
  @ApiBadRequestResponse({ description: 'Malformed id' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiConflictResponse({ description: 'Post already liked' })
  async like(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PostLikeResponseDto> {
    const summary = await this.postsService.like(id, user.id);
    response.setHeader('Location', `/posts/${id}/likes`);
    return {
      postId: summary.postId,
      likeCount: summary.likeCount,
      viewerHasLiked: summary.viewerHasLiked,
    };
  }

  @Delete(':id/likes')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove the current user's like (idempotent)" })
  @ApiNoContentResponse({ description: 'Like removed, or there was none' })
  @ApiBadRequestResponse({ description: 'Malformed id' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async unlike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.postsService.unlike(id, user.id);
  }
}
