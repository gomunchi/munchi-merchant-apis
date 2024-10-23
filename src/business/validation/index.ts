import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AvailableProvider } from 'src/provider/provider.type';

export class CredentialConfigDto {
  @ApiProperty({
    description: 'The name of the credentials',
    example: 'JSON API Key',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The type of credentials',
    example: 'api_key',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'The credential data',
    example: { apiKey: '1234abcde' },
  })
  @IsNotEmpty()
  credentials: any;

  @ApiProperty({
    description: 'Whether to reuse existing credentials with the same name',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  reuseExisting?: boolean;
}
export class BusinessProviderMappingDto {
  @ApiProperty({
    description: 'The public id of business',
    example: 'business-123',
  })
  @IsNotEmpty()
  @IsString()
  businessPublicId: string;

  @ApiProperty({
    description: 'The id of the provider for this business',
    example: 'wolt-123',
  })
  @IsNotEmpty()
  @IsString()
  providerId: string;
}

export class UnifiedProviderSetupDto {
  @ApiProperty({
    description: 'Array of business-provider mappings',
    type: [BusinessProviderMappingDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessProviderMappingDto)
  businessProviders: BusinessProviderMappingDto[];

  @ApiProperty({
    description: 'The name of the provider',
    example: 'Wolt',
  })
  @IsNotEmpty()
  @IsString()
  providerName: AvailableProvider;

  @ApiProperty({
    description: 'Credential configuration (optional)',
    type: CredentialConfigDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => CredentialConfigDto)
  @IsOptional()
  credential?: CredentialConfigDto;
}
