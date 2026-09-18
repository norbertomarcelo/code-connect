import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../database/database.constants.js';
import { users } from '../database/schema.js';
import { isUniqueViolation } from '../database/unique-violation.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const [user] = await this.db
        .insert(users)
        .values({ name: dto.name, email: dto.email, passwordHash })
        .returning();
      return user;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }
}
