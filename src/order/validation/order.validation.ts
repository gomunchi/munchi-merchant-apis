import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { AvailableOrderStatus } from '../dto/order.dto';
import { Transform } from 'class-transformer';
import { AvailableProvider } from 'src/provider/provider.type';

export class OrderStatusFilter {
  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  providers: AvailableProvider[];

  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  status: AvailableOrderStatus[];

  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  businessPublicIds: string[];
}

export class OrderRejectData {
  @IsString()
  @IsNotEmpty()
  provider: AvailableProvider;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
