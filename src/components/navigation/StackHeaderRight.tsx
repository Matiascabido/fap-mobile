import React, { type ReactNode } from 'react';
import { HeaderActions } from './HeaderIconButton';
import NotificationBellButton from './NotificationBellButton';

/** Acciones del header de stack: extras opcionales + campana (una sola fuente de verdad). */
export function StackHeaderRight({ actions }: { actions?: ReactNode }) {
  return (
    <HeaderActions>
      {actions}
      <NotificationBellButton />
    </HeaderActions>
  );
}
