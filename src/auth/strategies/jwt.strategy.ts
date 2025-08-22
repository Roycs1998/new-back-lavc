import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { EntityStatus } from '../../common/enums/entity-status.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId } = payload;

    const user = await this.usersService.findOne(userId);

    if (!user || user.status !== EntityStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: userId,
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString(),
      personId: user.personId?.toString(),
      emailVerified: user.emailVerified,
    };
  }
}
