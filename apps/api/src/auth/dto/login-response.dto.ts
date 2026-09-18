import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: '2026-09-16T15:00:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
