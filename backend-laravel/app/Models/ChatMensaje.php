<?php

namespace App\Models;

class ChatMensaje extends ModeloBase
{
    protected $table = 'chat_mensajes';

    protected function casts(): array { return ['created_at' => 'datetime']; }
}
