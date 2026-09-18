import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from '../../users/dto/author-response.dto.js';

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  postId!: string;

  @ApiProperty({ type: String, nullable: true })
  parentId!: string | null;

  @ApiProperty()
  body!: string;

  @ApiProperty({ example: '2026-09-18T15:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: AuthorResponseDto })
  author!: AuthorResponseDto;
}

export class CommentThreadResponseDto extends CommentResponseDto {
  @ApiProperty({ type: CommentResponseDto, isArray: true })
  replies!: CommentResponseDto[];
}
