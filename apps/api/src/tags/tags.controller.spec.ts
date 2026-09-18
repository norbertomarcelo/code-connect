import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller.js';
import { TagsService } from './tags.service.js';

describe('TagsController', () => {
  let controller: TagsController;
  let tagsService: { findAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    tagsService = { findAll: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [{ provide: TagsService, useValue: tagsService }],
    }).compile();

    controller = module.get(TagsController);
  });

  it('lists tags as slug and label only', async () => {
    tagsService.findAll.mockResolvedValue([
      { slug: 'react', label: 'React', id: 'internal' },
    ]);

    expect(await controller.findAll()).toEqual([
      { slug: 'react', label: 'React' },
    ]);
  });
});
