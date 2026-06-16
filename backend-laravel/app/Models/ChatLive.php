<?php

namespace App\Models;

class ChatLive extends ModeloBase
{
    protected $table = 'chat_live';

    protected function casts(): array { return ['fecha' => 'datetime']; }
}
