export interface PasswordChecks {
  minLength: boolean
  uppercase: boolean
  number: boolean
  special: boolean
}

export function checkPassword(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{}|;:',.<>?/]/.test(password),
  }
}

export function passwordIsStrong(password: string): boolean {
  const c = checkPassword(password)
  return c.minLength && c.uppercase && c.number && c.special
}
