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
    description: 'The status of the config',
    example: 'Status',
  })
  @IsNotEmpty()
  @IsString()
  name: AvailableProvider;

  @ApiProperty({
    description: 'The id of the provider',
    example: '1234abcde',
  })
  @IsNotEmpty()
  @IsString()
  providerId: string;
}
