import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AvailableProvider } from 'src/provider/provider.type';

export class ProviderDto {
  @ApiProperty({
    description: 'The public id of business',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The name of the provider',
    example: 'Wolt',
  })
  @IsNotEmpty()
  @IsString()
  providerName: AvailableProvider;

  @ApiProperty({
    description: 'The id of the provider',
    example: '1234abcde',
  })
  @IsNotEmpty()
  @IsString()
  providerId: string;

  @ApiProperty({
    description: 'The type of the provider',
    example: '1234abcde',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'The name of the credentials',
    example: 'JSON api',
  })
  @IsNotEmpty()
  @IsString()
  credentialName: string;

  @ApiProperty({
    description: 'The credentials of the provider',
    example: '1234abcde',
  })
  @IsNotEmpty()
  credentials: any;
}
