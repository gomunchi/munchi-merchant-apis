import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';
import { AvailableProvider } from 'src/provider/provider.type';

export class ReminderScheduleBodyData {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsISO8601()
  reminderTime: string;

  @IsNotEmpty()
  @IsString()
  businessPublicId: string;

  @IsNotEmpty()
  @IsString()
  providerOrderId: string;

  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @IsNotEmpty()
  @IsString()
  provider: AvailableProvider;
}
