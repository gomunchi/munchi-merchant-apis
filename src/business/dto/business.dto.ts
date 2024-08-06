import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { AvailableProvider } from 'src/provider/provider.type';
import { OwnerDto } from './owner.dto';

@Exclude()
export class BusinessDto {
  @ApiProperty({
    description: 'The id of business',
    example: '123456',
  })
  @Expose({ name: 'id' })
  id: string;

  @ApiProperty({
    description: 'The name of business',
    example: 'Juicy Burger',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The email of business',
    example: 'juicyburger@munchi.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'A short description of the business',
    example: 'The restaurant is easy is easy to find.',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'The phone number of the business',
    example: '0123456789',
  })
  @Expose()
  phone: string;

  @ApiProperty({
    description: 'The address of business',
    example: 'Helsinkikatu 100C, Helsinki, Finland',
  })
  @Expose()
  address: string;

  @ApiProperty({
    description: 'The logo of business',
    example: 'logo url',
  })
  @Expose()
  logo: string;

  @Expose({ name: 'timezone' })
  timeZone: string;

  @ApiProperty({
    description: 'The address of business',
    example: true,
  })
  @Expose()
  enabled: boolean;

  @Expose()
  open: boolean;

  // @ApiProperty({
  //   description: 'Schedule for today',
  //   example: {
  //     "enabled": true,
  //     "lapses": [
  //       {
  //         "open": {
  //           "hour": 0,
  //           "minute": 0
  //         },
  //         "close": {
  //           "hour": 23,
  //           "minute": 30
  //         }
  //       }
  //     ]
  //   },
  // })
  // @Expose()
  // today: Schedule;

  @ApiProperty({
    description: 'The owners of business',
    example: {
      id: '123456',
      name: 'John doe',
      lastName: 'John',
      email: 'johndoe@gmail.com',
      level: 2,
    },
  })
  @Expose({ groups: ['included_owners'] })
  @Type(() => OwnerDto)
  owners: OwnerDto[];
  constructor(partial: Partial<OwnerDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class AllBusinessDto {
  // @Expose() id: number;
  @ApiProperty({
    description: 'The id of business',
    example: '123456',
  })
  @Expose({ name: 'id' })
  id: string;

  @ApiProperty({
    description: 'The name of business',
    example: 'Juicy Burger',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The logo of business',
    example: 'logo url',
  })
  @Expose()
  logo: string;

  // @Expose() timezone: string;
  constructor(partial: Partial<AllBusinessDto>) {
    Object.assign(this, partial);
  }
}

export class SetOnlineStatusDto {
  @ApiProperty({
    description: 'The public id of business',
    example: '123456',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Provider want to disable',
    example: 'Testing',
  })
  @IsString()
  provider: AvailableProvider;

  @ApiProperty({
    description: 'Status want to set. true for on and false for off',
    example: false,
  })
  @IsBoolean()
  status: boolean;

  @ApiProperty({
    description: 'Duration in minute(s) you want it to be offline in case status is false',
    example: 20,
  })
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  duration: number;
}

export class GetOnlineStatusDto {}
