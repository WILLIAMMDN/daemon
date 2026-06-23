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
  LOGIN_PASSWORD_MIN_LENGTH: 3,
  REGISTRO_PASSWORD_MIN_LENGTH: 8,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  requiredFieldMessage(field: string): string {
    return `El campo ${field} es obligatorio.`;
  },
  minLengthMessage(field: string, length: number): string {
    return `El ${field} debe tener al menos ${length} caracteres.`;
  },
  invalidEmailMessage: 'Ingresa un correo electr\u00f3nico v\u00e1lido.',
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
    return AuthValidators.requiredFieldMessage('correo electr\u00f3nico');
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
    return AuthValidators.requiredFieldMessage('contrase\u00f1a');
  }

  if (datos.password.length < AuthValidators.REGISTRO_PASSWORD_MIN_LENGTH) {
    return AuthValidators.minLengthMessage('contrase\u00f1a', AuthValidators.REGISTRO_PASSWORD_MIN_LENGTH);
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
    return AuthValidators.requiredFieldMessage('contrase\u00f1a');
  }

  if (password.length < AuthValidators.LOGIN_PASSWORD_MIN_LENGTH) {
    return AuthValidators.minLengthMessage('contrase\u00f1a', AuthValidators.LOGIN_PASSWORD_MIN_LENGTH);
  }

  return null;
}
