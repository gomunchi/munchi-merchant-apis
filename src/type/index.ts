import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { AvailableOrderStatus } from 'src/order/dto/order.dto';
import { AvailableProvider } from 'src/provider/provider.type';

export class AuthCredentials {
  @ApiProperty({
    description: 'Input email provided',
    example: 'johndoe@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({
    description: 'Input password provided',
    type: 'password',
    example: '3432asa',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export type OrderId = number;

export type FilterQuery = {
  businessId: number;
  status: number | number[];
};

export interface OrderData {
  provider: AvailableProvider;
  preparedIn?: string;
  orderStatus: AvailableOrderStatus;
  reason?: string;
}

export type BusinessAttributes = {
  name: string;
  email: string;
  slug: string;
  city_id: number;
  enabled: boolean;
};

export type AuthTokens = {
  verifyToken: string;
  refreshToken: string;
};
