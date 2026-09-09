import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { AdminUpdateUserDto, UpdateProfileDto, UserQueryDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Perbarui profil sendiri' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Daftar pengguna (admin)' })
  list(@Query() query: UserQueryDto) {
    return this.users.list(query, query.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ubah role / status aktif pengguna (admin)' })
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.users.adminUpdate(id, dto);
  }
}

@ApiTags('Instructors')
@Public()
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar instruktur' })
  list() {
    return this.users.listInstructors();
  }
}
