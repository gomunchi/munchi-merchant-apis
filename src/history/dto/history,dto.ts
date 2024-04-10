import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AvailableOrderStatus, AvailablePayMethod } from 'src/order/dto/order.dto';
import { AvailableProvider } from 'src/provider/provider.type';

export type AvailableDateOption =
  | 'today'
  | 'yesterday'
  | 'last-week'
  | 'last-month'
  | 'this-month'
  | 'this-week';

export class HistoryQuery {
  @IsString()
  @IsNotEmpty()
  date: AvailableDateOption;

  @IsString()
  @IsNotEmpty()
  page: string;

  @IsString()
  @IsNotEmpty()
  rowPerPage: string;
}

export class HistoryFilterQuery {
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  provider: AvailableProvider[];

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  payMethod: AvailablePayMethod[];

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  orderStatus: AvailableOrderStatus[];
}
