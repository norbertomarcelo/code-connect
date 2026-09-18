import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagResponseDto } from './dto/tag-response.dto.js';
import { TagsService } from './tags.service.js';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'List every tag' })
  @ApiOkResponse({ type: TagResponseDto, isArray: true })
  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.tagsService.findAll();
    return tags.map(({ slug, label }) => ({ slug, label }));
  }
}
