import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { toCommentDto, toCommentThreadDto } from './comment.mapper.js';
import { CommentsService } from './comments.service.js';
import {
  CommentResponseDto,
  CommentThreadResponseDto,
} from './dto/comment-response.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'List the comments of a post, replies embedded' })
  @ApiOkResponse({ type: CommentThreadResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Malformed id' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async listByPost(
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<CommentThreadResponseDto[]> {
    const threads = await this.commentsService.listByPost(postId);
    return threads.map(toCommentThreadDto);
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comment on a post, or reply to a root comment' })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiBadRequestResponse({ description: 'Malformed id' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiNotFoundResponse({ description: 'Post or parent comment not found' })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed, or the parent is itself a reply',
  })
  async create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsService.create(postId, user.id, dto);
    response.setHeader('Location', `/comments/${comment.id}`);
    return toCommentDto(comment);
  }

  @Get('comments/:id')
  @ApiOperation({ summary: 'Get a comment' })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiBadRequestResponse({ description: 'Malformed id' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommentResponseDto> {
    return toCommentDto(await this.commentsService.findOne(id));
  }
}
