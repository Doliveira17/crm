export const normalizeDigits = (value: string | null | undefined): string | null => {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits || null
}

export const normalizeEmail = (value: string | null | undefined): string | null => {
  if (!value) return null
  return value.trim().toLowerCase() || null
}

export const normalizeText = (value: string | null | undefined): string | null => {
  if (!value) return null
  return value.trim() || null
}

export const formatPhoneBR = (value: string | null | undefined): string => {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return value
}

export const formatDocument = (value: string | null | undefined): string => {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

export const formatCEP = (value: string | null | undefined): string => {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  
  if (digits.length === 8) {
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
  }
  return value
}
