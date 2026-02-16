'use client'

import type { ComponentProps } from 'react'
import { ClienteForm as BaseClienteForm } from './ClienteForm'

type ClienteFormCleanProps = ComponentProps<typeof BaseClienteForm>

export function ClienteForm(props: ClienteFormCleanProps) {
  return <BaseClienteForm {...props} />
}
