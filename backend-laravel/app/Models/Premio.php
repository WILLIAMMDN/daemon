<?php

namespace App\Models;

class Premio extends ModeloBase
{
    protected $table = 'premios';

    protected $hidden = ['datos_secretos'];
}
