import { IsNotEmpty, IsString } from 'class-validator';

export class ApiKeyData {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}
