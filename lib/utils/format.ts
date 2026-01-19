export const formatDate = (date: string | null | undefined): string => {
  if (!date) return ''
  
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return ''
  }
}

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return ''
  
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return ''
  }
}
