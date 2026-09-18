import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from '../../users/dto/author-response.dto.js';
import { TagResponseDto } from '../../tags/dto/tag-response.dto.js';

export class PostSummaryResponseDto {
  @ApiProperty({ example: 'c3e2e6a0-1e4a-4b8a-9a3e-2e6a0c3e2e6a' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: String, nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty({ example: '2026-09-18T15:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: AuthorResponseDto })
  author!: AuthorResponseDto;

  @ApiProperty({ type: TagResponseDto, isArray: true })
  tags!: TagResponseDto[];

  @ApiProperty()
  likeCount!: number;

  @ApiProperty()
  commentCount!: number;

  @ApiProperty({ description: 'Always false for anonymous callers' })
  viewerHasLiked!: boolean;
}

export class PostDetailResponseDto extends PostSummaryResponseDto {
  @ApiProperty()
  body!: string;
}

export class PaginatedPostsResponseDto {
  @ApiProperty({ type: PostSummaryResponseDto, isArray: true })
  items!: PostSummaryResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
