import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(25000)
  content: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}
