import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Achei muito bom seu código!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body!: string;

  @ApiPropertyOptional({
    description:
      'Id of the root comment being answered. Replies nest one level.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
