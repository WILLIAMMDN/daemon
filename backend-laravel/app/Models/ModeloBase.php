<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

abstract class ModeloBase extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];
}
