import { Module } from '@nestjs/common';
import { OrderingOrderMapperService } from './ordering/ordering-order-mapper';
import { OrderingRepositoryService } from './ordering/ordering-repository';
import { OrderingSyncService } from './ordering/ordering-sync';
import { OrderingService } from './ordering/ordering.service';
import { ProviderManagmentService } from './provider-management.service';
import { ProviderEnum } from './provider.type';
import { WoltOrderMapperService } from './wolt/wolt-order-mapper';
import { WoltRepositoryService } from './wolt/wolt-repository';
import { WoltSyncService } from './wolt/wolt-sync';
import { WoltService } from './wolt/wolt.service';
import { FoodoraService } from './foodora/foodora.service';
import { OrderingMenuMapperService } from './ordering/ordering-menu-mapper';
import { WoltMenuMapperService } from './wolt/wolt-menu-mapper';
import { WoltWebhookService } from './wolt/wolt-webhook';

@Module({
  providers: [
    ProviderManagmentService,
    // Ordering Services
    OrderingService,
    OrderingOrderMapperService,
    OrderingRepositoryService,
    OrderingMenuMapperService,
    OrderingSyncService,
    // Wolt Services
    WoltService,
    WoltOrderMapperService,
    WoltRepositoryService,
    WoltMenuMapperService,
    WoltSyncService,
    WoltWebhookService,
    // Foodora Services
    FoodoraService,
    {
      provide: `${ProviderEnum.Munchi}Service`,
      useClass: OrderingService,
    },
    {
      provide: `${ProviderEnum.Wolt}Service`,
      useClass: WoltService,
    },
  ],
  exports: [
    OrderingService,
    OrderingOrderMapperService,
    OrderingRepositoryService,
    OrderingMenuMapperService,
    WoltService,
    ProviderManagmentService,
    WoltOrderMapperService,
    WoltMenuMapperService,
    WoltRepositoryService,
    WoltSyncService,
    WoltWebhookService,
  ],
})
export class ProviderModule {}
