import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany();
  }

  findById(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }
}
