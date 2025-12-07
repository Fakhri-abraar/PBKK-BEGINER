import { IsNotEmpty, IsString } from 'class-validator';

export class JwtPayloadDto {
  @IsNotEmpty()
  @IsString()
  sub: string;

  @IsNotEmpty()
  @IsString()
  username: string;
}
