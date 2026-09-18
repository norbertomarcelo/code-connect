import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: 'front-end' })
  slug!: string;

  @ApiProperty({ example: 'Front-end' })
  label!: string;
}
