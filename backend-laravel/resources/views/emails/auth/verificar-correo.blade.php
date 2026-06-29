<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Confirma tu correo DAEMON</title>
</head>
<body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#14213d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d8e0ec;">
                    <tr>
                        <td style="padding:28px 32px 12px;border-top:5px solid #0d6efd;">
                            <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#62708a;font-weight:700;">DAEMON</p>
                            <h1 style="margin:0;font-size:28px;line-height:1.2;color:#091b33;">Confirma tu correo</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 32px 4px;font-size:16px;line-height:1.6;">
                            <p>Hola {{ $usuario->nombre_completo ?: $usuario->usuario }},</p>
                            <p>Gracias por crear tu cuenta en DAEMON. Para terminar de activarla y poder recuperar el acceso en el futuro, confirma que este correo es tuyo.</p>
                            <p style="text-align:center;margin:30px 0;">
                                <a href="{{ $link }}" style="display:inline-block;background:#0d6efd;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:6px;">
                                    Confirmar mi correo
                                </a>
                            </p>
                            <p>El enlace expira en 24 horas. Si no confirmas, puedes seguir usando DAEMON, pero algunas funciones avanzadas podrian requerir el correo verificado.</p>
                            <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 32px 28px;color:#6a768d;font-size:13px;line-height:1.5;border-top:1px solid #e6edf5;">
                            <p style="margin:0;">Si el boton no funciona, abre este enlace:</p>
                            <p style="word-break:break-all;margin:8px 0 0;">{{ $link }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>