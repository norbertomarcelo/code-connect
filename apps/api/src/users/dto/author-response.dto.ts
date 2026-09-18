import { ApiProperty } from '@nestjs/swagger';

export class AuthorResponseDto {
  @ApiProperty({ example: 'c3e2e6a0-1e4a-4b8a-9a3e-2e6a0c3e2e6a' })
  id!: string;

  @ApiProperty({ example: 'Júlio Andrade' })
  name!: string;

  @ApiProperty({ example: 'julio' })
  handle!: string;
}
