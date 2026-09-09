import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

/** Menandai endpoint bisa diakses tanpa autentikasi. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Membatasi endpoint hanya untuk role tertentu. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  companyId?: string | null;
}

/** Mengambil user hasil verifikasi JWT dari request. */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    return field ? user?.[field] : user;
  },
);
