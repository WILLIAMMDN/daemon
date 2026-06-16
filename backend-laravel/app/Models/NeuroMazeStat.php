<?php

namespace App\Models;

class NeuroMazeStat extends ModeloBase
{
    protected $table = 'neuro_maze_stats';

    protected function casts(): array { return ['updated_at' => 'datetime']; }
}
