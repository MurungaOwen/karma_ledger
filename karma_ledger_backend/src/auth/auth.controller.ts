import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/createUser';
import { LoginDto } from './dto/login.dto';
import { handleError } from 'src/util/error';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async createUser(@Body() userData: CreateUserDto) {
    try {
      const user = await this.usersService.createUser(userData);
      const loginResponse = await this.authService.login(user);
      return {
        message: 'User created successfully',
        access_token: loginResponse.access_token,
        data: user.toJSON(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: handleError(error),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }
}
