import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private prismaService: PrismaService) {}

  async validateApiKey(apiKey: string) {
    //get api key

    const apiKeys = await this.prismaService.apiKey.findMany({
      orderBy: {
        id: 'desc',
      },
    });

    if (apiKeys.length === 0) {
      return 'No api key';
    }

    return apiKeys.find((apiK) => apiK.value === apiKey);
  }

  async createApiKey(name: string, value: string) {
    const apiKey = await this.prismaService.apiKey.findFirst({
      where: {
        name: {
          contains: name,
        },
        OR: [
          {
            value: {
              equals: value,
            },
          },
        ],
      },
    });

    if (!apiKey) {
      return await this.prismaService.apiKey.create({
        data: {
          name: name,
          value: value,
        },
        select: {
          name: true,
          value: true,
        },
      });
    } else {
      return await this.prismaService.apiKey.upsert({
        create: {
          name: name,
          value: value,
        },
        update: {
          name: name,
          value: value,
        },
        where: {
          id: apiKey.id,
        },
        select: {
          name: true,
          value: true,
        },
      });
    }
    //Save api key to database
  }

  async addApiKey(name: string, value: string) {
    await this.createApiKey(name, value);
  }
}
