DAEMON - Confirma tu correo

Hola {{ $usuario->nombre_completo ?: $usuario->usuario }},

Gracias por crear tu cuenta en DAEMON. Para terminar de activarla y poder
recuperar el acceso en el futuro, confirma que este correo es tuyo abriendo
este enlace:

{{ $link }}

El enlace expira en 24 horas. Si no confirmas, puedes seguir usando DAEMON,
pero algunas funciones avanzadas podrian requerir el correo verificado.

Si no creaste esta cuenta, puedes ignorar este mensaje.