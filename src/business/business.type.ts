import { Prisma } from '@prisma/client';

export const BusinessInfoSelectBase = Prisma.validator<Prisma.BusinessSelect>()({
  id: true,
  name: true,
  publicId: true,
  logo: true,
  address: true,
  phone: true,
  email: true,
  description: true,
});
