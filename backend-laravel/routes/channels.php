<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.Usuario.{id}', function ($usuario, $id) {
    return (int) $usuario->id === (int) $id;
});
