import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const organizationName = user.organizationId
      ? ((await this.organizationsService.findById(user.organizationId))?.name ?? null)
      : null;

    return { ...user, organizationName };
  }
}
