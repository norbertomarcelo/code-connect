import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Lista acessível com teclado em React' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Como navegar uma lista só com as setas.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 'const [active, setActive] = useState(0)' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://example.com/capa.png',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ example: ['React', 'Front-end'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}
