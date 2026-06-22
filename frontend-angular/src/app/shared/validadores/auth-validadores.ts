export interface AuthRegistroDatos {
  nombre_completo: string;
  email: string;
  usuario: string;
  password: string;
  nivel: string;
}

export const AuthValidators = {
  NOMBRE_MIN_LENGTH: 3,
  USUARIO_MIN_LENGTH: 4,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  requiredFieldMessage(field: string): string {
    return `El campo ${field} es obligatorio.`;
  },
  minLengthMessage(field: string, length: number): string {
    return `El ${field} debe tener al menos ${length} caracteres.`;
  },
  invalidEmailMessage: 'Ingresa un correo electrónico válido.',
  generalFormError: 'Por favor completa todos los campos correctamente.',
};

export function validarRegistro(datos: AuthRegistroDatos): string | null {
  if (!datos.nombre_completo?.trim()) {
    return AuthValidators.requiredFieldMessage('nombre completo');
  }

  if (datos.nombre_completo.trim().length < AuthValidators.NOMBRE_MIN_LENGTH) {
    return AuthValidators.minLengthMessage('nombre completo', AuthValidators.NOMBRE_MIN_LENGTH);
  }

  if (!datos.email?.trim()) {
    return AuthValidators.requiredFieldMessage('correo electrónico');
  }

  if (!AuthValidators.EMAIL_PATTERN.test(datos.email)) {
    return AuthValidators.invalidEmailMessage;
  }

  if (!datos.usuario?.trim()) {
    return AuthValidators.requiredFieldMessage('usuario');
  }

  if (datos.usuario.trim().length < AuthValidators.USUARIO_MIN_LENGTH) {
    return AuthValidators.minLengthMessage('usuario', AuthValidators.USUARIO_MIN_LENGTH);
  }

  if (!datos.password) {
    return AuthValidators.requiredFieldMessage('contraseña');
  }

  if (datos.password.length < AuthValidators.PASSWORD_MIN_LENGTH) {
    return AuthValidators.minLengthMessage('contraseña', AuthValidators.PASSWORD_MIN_LENGTH);
  }

  return null;
}

export function validarCredenciales(usuario: string, password: string): string | null {
  if (!usuario?.trim()) {
    return AuthValidators.requiredFieldMessage('usuario');
  }

  if (usuario.trim().length < AuthValidators.USUARIO_MIN_LENGTH) {
    return AuthValidators.minLengthMessage('usuario', AuthValidators.USUARIO_MIN_LENGTH);
  }

  if (!password) {
    return AuthValidators.requiredFieldMessage('contraseña');
  }

  if (password.length < AuthValidators.PASSWORD_MIN_LENGTH) {
    return AuthValidators.minLengthMessage('contraseña', AuthValidators.PASSWORD_MIN_LENGTH);
  }

  return null;
}
