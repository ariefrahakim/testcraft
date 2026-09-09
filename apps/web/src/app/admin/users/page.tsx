'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { Paginated, UserDto } from '@testcraft/shared';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/workspace/workspace-shell';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { useT } from '@/lib/i18n';
import { formatDate, initials } from '@/lib/format';

interface UserRow extends UserDto {
  isActive: boolean;
  lastLoginAt: string | null;
}

const ROLES = [
  { value: 'STUDENT', labelKey: 'adm.roleStudent' },
  { value: 'INSTRUCTOR', labelKey: 'adm.roleInstructor' },
  { value: 'CORPORATE_ADMIN', labelKey: 'adm.roleCorporate' },
  { value: 'ADMIN', labelKey: 'adm.roleAdmin' },
  { value: 'SUPER_ADMIN', labelKey: 'adm.roleSuperAdmin' },
] as const;

export default function AdminUsersPage() {
  const t = useT();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const query = `/users?limit=50${q ? `&q=${encodeURIComponent(q)}` : ''}${
    role ? `&role=${role}` : ''
  }`;
  const { data, loading, reload } = useApi<Paginated<UserRow>>(query, [q, role]);
  const rows = data?.data ?? [];

  async function changeRole(user: UserRow, newRole: string) {
    setError('');
    setBusyId(user.id);
    try {
      await api.patch(`/users/${user.id}`, { role: newRole }, { auth: true });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('crud.saveFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(user: UserRow) {
    setError('');
    setBusyId(user.id);
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive }, { auth: true });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('crud.saveFailed'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t('adm.usersTitle')}
        description={t('adm.usersSubtitle')}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card>
        <CardHeader
          title={t('adm.userList')}
          description={t('adm.accountsCount', { count: data?.meta.total ?? 0 })}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('adm.searchUser')}
                  aria-label={t('adm.searchUser')}
                  className="w-full pl-9 sm:w-56"
                />
              </div>
              <Select
                aria-label={t('adm.allRoles')}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="sm:w-44"
              >
                <option value="">{t('adm.allRoles')}</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
          }
        />
        {loading ? (
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState title={t('adm.noUsers')} description={t('adm.noUsersHint')} />
        ) : (
          <CardBody className="overflow-x-auto">
            <table className="table-responsive">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-semibold">{t('menu.users')}</th>
                  <th className="pb-2 pr-4 font-semibold">Role</th>
                  <th className="pb-2 pr-4 font-semibold">{t('table.status')}</th>
                  <th className="pb-2 pr-4 font-semibold">{t('adm.lastLogin')}</th>
                  <th className="pb-2 text-right font-semibold">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td data-label={t('menu.users')} className="py-3 pr-4">
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                          {initials(u.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-navy dark:text-white">
                            {u.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {u.email}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td data-label="Role" className="py-3 pr-4">
                      <Select
                        aria-label={t('adm.roleOf', { name: u.name })}
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="w-44"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {t(r.labelKey)}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td data-label={t('table.status')} className="py-3 pr-4">
                      <StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td data-label={t('adm.lastLogin')} className="py-3 pr-4 text-slate-500">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : t('adm.neverLoggedIn')}
                    </td>
                    <td data-label={t('table.actions')} className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive(u)}
                        disabled={busyId === u.id}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {busyId === u.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {t(u.isActive ? 'adm.deactivate' : 'adm.activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        )}
      </Card>
    </>
  );
}
