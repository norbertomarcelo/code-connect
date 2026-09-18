import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function splitTags(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value as string[];
  if (typeof value !== 'string') return undefined;
  const parts = value
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export class ListPostsQueryDto {
  @ApiPropertyOptional({
    description: 'Full-text search over title, description and body',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated tag slugs; a post must carry every one',
    example: 'react,front-end',
  })
  @IsOptional()
  @Transform(({ value }) => splitTags(value))
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['recent', 'popular'], default: 'recent' })
  @IsOptional()
  @IsIn(['recent', 'popular'])
  sort: 'recent' | 'popular' = 'recent';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
