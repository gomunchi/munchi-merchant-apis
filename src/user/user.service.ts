import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import moment from 'moment';

import { PrismaService } from 'src/prisma/prisma.service';
import { OrderingUser } from 'src/provider/ordering/ordering.type';
import { getPassword } from './utils';

type UserInfoSelectBase = {
  id: true;
  firstName: true;
};

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  getUserInternally = async (orderingUserId: number, publicUserId: string) => {
    if (orderingUserId === null) {
      const user = await this.prismaService.user.findUnique({
        where: {
          publicId: publicUserId,
        },
        include: {
          businesses: true,
        },
      });
      return user;
    } else {
      const user = await this.prismaService.user.findUnique({
        where: {
          orderingUserId: orderingUserId,
        },
        include: {
          businesses: true,
        },
      });
      return user;
    }
  };

  deleteUser = async (userId: number) => {
    const user = await this.getUserInternally(userId, null);
    const deleteUser = await this.prismaService.user.delete({
      where: {
        id: user.id,
      },
    });

    return deleteUser;
  };

  async getUserByPublicId<S extends Prisma.UserSelect>(
    publicId: string,
    select?: S,
  ): Promise<Prisma.UserGetPayload<{ select: S }>> {
    return await this.prismaService.user.findFirst({
      where: {
        publicId,
      },
      select,
    });
  }

  async getUserByOrderingUserId<S extends Prisma.UserSelect = UserInfoSelectBase>(
    orderingUserId: number,
    select: S,
  ) {
    return await this.prismaService.user.findUnique({
      where: {
        orderingUserId,
      },
      select,
    });
  }

  async upsertUserFromOrderingInfo<S extends Prisma.UserSelect = UserInfoSelectBase>(
    userInfo: OrderingUser & { password: string },
    select: S,
  ) {
    const expiredAt = moment().utc().add(userInfo.session.expires_in, 'milliseconds');

    const data = {
      firstName: userInfo.name,
      lastName: userInfo.lastname,
      orderingUserId: userInfo.id,
      orderingAccessToken: userInfo.session.access_token,
      orderingAccessTokenExpiredAt: expiredAt.format(),
      email: userInfo.email,
      level: userInfo.level,
      hash: getPassword(userInfo.password, true),
    };

    return await this.prismaService.user.upsert({
      where: {
        orderingUserId: userInfo.id,
      },
      create: data,
      update: data,
      select,
    });
  }

  async validateUser(userId: string | number) {
    const searchField = typeof userId === 'number' ? 'orderingUserId' : 'publicId';
    const whereClause: any = {};
    whereClause[searchField] = userId;
    const user = await this.prismaService.user.findMany({
      where: whereClause,
    });

    if (!user || user.length === 0) {
      throw new NotFoundException('No user found');
    }

    return user;
  }
}
