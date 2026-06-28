<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        if (Schema::hasTable('usuarios') && Schema::hasTable('bots_alumnos')) {
            return;
        }

        $this->crearUsuarios();
        $this->crearTablasIndependientes();
        $this->crearTablasConDependencias();
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        Schema::disableForeignKeyConstraints();

        foreach ($this->tablasParaEliminar() as $tabla) {
            Schema::dropIfExists($tabla);
        }

        Schema::enableForeignKeyConstraints();
    }

    private function crearUsuarios(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_completo', 100);
            $table->string('email', 100)->nullable()->unique();
            $table->string('google_id')->nullable()->unique();
            $table->boolean('perfil_completo')->default(true);
            $table->string('usuario', 50)->unique();
            $table->string('password_hash');
            $table->string('nivel', 20);
            $table->integer('pro_tokens')->default(0);
            $table->string('rango', 50)->default('Novato');
            $table->text('biografia')->nullable();
            $table->timestamp('fecha_registro')->useCurrent();
            $table->integer('tokens')->default(0);
            $table->string('avatar')->nullable();
            $table->string('rol', 20)->default('alumno');
            $table->string('insignia')->nullable();
            $table->integer('mision_actual')->default(1);
            $table->string('fondo')->nullable();
            $table->string('heroe')->nullable();
            $table->string('genero', 20)->default('hombre');
        });
    }

    private function crearTablasIndependientes(): void
    {
        Schema::create('chat_live', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_usuario');
            $table->string('nombre', 100);
            $table->text('mensaje');
            $table->string('rol', 50)->default('alumno');
            $table->timestamp('fecha')->useCurrent();
        });

        Schema::create('competencia_live', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno_en_tarima')->nullable();
            $table->string('estado', 30)->default('espera');
            $table->decimal('promedio_alumnos', 4, 2)->default(0);
            $table->integer('puntos_docente')->default(0);
            $table->timestamp('updated_at')->useCurrent();
            $table->dateTime('fin_votacion')->nullable();
            $table->integer('duracion')->default(60);
        });

        Schema::create('desafios', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->integer('recompensa');
            $table->string('tipo_evidencia', 30)->default('link');
            $table->string('nivel_requerido', 20)->default('TODOS');
            $table->string('estado', 30)->default('activo');
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->boolean('es_mision_nivel')->default(false);
        });

        Schema::create('examenes', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 100);
            $table->string('nivel', 20);
            $table->string('estado', 30)->default('borrador');
            $table->timestamp('fecha_creacion')->useCurrent();
        });

        Schema::create('historial_rondas', function (Blueprint $table) {
            $table->id();
            $table->dateTime('fecha')->useCurrent();
            $table->string('nivel', 50)->nullable();
            $table->string('ganador_nombre', 100)->nullable();
            $table->decimal('ganador_promedio', 3, 1)->nullable();
            $table->json('top_ranking')->nullable();
        });

        Schema::create('insignias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('imagen');
            $table->text('descripcion')->nullable();
        });

        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email');
            $table->string('phone', 50)->nullable();
            $table->string('status', 30)->default('new');
            $table->timestamps();
        });

        Schema::create('premios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->integer('precio');
            $table->integer('stock')->default(0);
            $table->string('imagen')->default('img/premios/default.png');
            $table->string('categoria', 30)->default('GENERAL');
            $table->text('datos_secretos')->nullable();
            $table->string('tipo_entrega', 30)->default('fisico');
        });

        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('role', 100);
            $table->text('bio');
            $table->string('photo_url')->nullable();
            $table->timestamps();
        });
    }

    private function crearTablasConDependencias(): void
    {
        Schema::create('bots_alumnos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->string('nombre_bot', 100)->nullable();
            $table->text('system_prompt')->nullable();
            $table->dateTime('fecha_creacion')->useCurrent();
            $table->string('avatar')->default('img/bot_default.png');
            $table->text('conocimiento')->nullable();
            $table->longText('matriz_neural')->nullable();
            $table->integer('victorias')->default(0);
            $table->integer('nivel_entrenamiento')->default(1);
            $table->index('id_alumno');
        });

        Schema::create('canjes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno')->constrained('usuarios');
            $table->foreignId('id_premio')->constrained('premios');
            $table->timestamp('fecha')->useCurrent();
            $table->string('estado', 30)->default('pendiente');
            $table->boolean('visto_por_alumno')->default(false);
            $table->index('id_alumno');
            $table->index('id_premio');
        });

        Schema::create('chat_mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->string('role', 30);
            $table->text('content');
            $table->timestamp('created_at')->useCurrent();
            $table->index('id_alumno');
        });

        Schema::create('cuentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno');
            $table->string('titulo', 150)->nullable();
            $table->string('img_1')->nullable();
            $table->string('img_2')->nullable();
            $table->string('img_3')->nullable();
            $table->string('img_4')->nullable();
            $table->string('img_5')->nullable();
            $table->string('img_6')->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->string('pos_1', 20)->default('bottom');
            $table->string('pos_2', 20)->default('bottom');
            $table->string('pos_3', 20)->default('bottom');
            $table->string('pos_4', 20)->default('bottom');
            $table->string('pos_5', 20)->default('bottom');
            $table->string('pos_6', 20)->default('bottom');
            $table->longText('data_1')->nullable();
            $table->longText('data_2')->nullable();
            $table->longText('data_3')->nullable();
            $table->longText('data_4')->nullable();
            $table->longText('data_5')->nullable();
            $table->longText('data_6')->nullable();
        });

        Schema::create('entregas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_desafio');
            $table->foreignId('id_alumno');
            $table->text('archivo_url');
            $table->string('estado', 30)->default('pendiente');
            $table->integer('calificacion')->default(0);
            $table->timestamp('fecha_entrega')->useCurrent();
            $table->text('comentario_docente')->nullable();
        });

        Schema::create('historial_movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_docente');
            $table->foreignId('id_alumno');
            $table->integer('cantidad');
            $table->timestamp('fecha')->useCurrent();
            $table->foreignId('id_operador')->nullable();
            $table->string('motivo')->default('Ajuste manual');
        });

        Schema::create('ia_modelos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->string('nombre_proyecto', 100);
            $table->longText('modelo_json');
            $table->timestamp('fecha_actualizacion')->useCurrent();
            $table->index('id_alumno');
        });

        Schema::create('insignias_otorgadas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno');
            $table->foreignId('id_insignia');
            $table->timestamp('fecha')->useCurrent();
        });

        Schema::create('neuro_maze_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno');
            $table->integer('episodios_totales')->default(0);
            $table->integer('mejor_tiempo_pasos')->default(9999);
            $table->integer('tokens_ganados')->default(0);
            $table->timestamp('updated_at')->useCurrent();
            $table->index('id_alumno');
        });

        Schema::create('preguntas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examen_id')->constrained('examenes')->cascadeOnDelete();
            $table->text('enunciado');
            $table->string('tipo', 30);
            $table->json('opciones')->nullable();
            $table->string('respuesta_correcta')->nullable();
            $table->integer('orden')->default(0);
            $table->index('examen_id');
        });

        Schema::create('premios_stock_digital', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_premio')->constrained('premios')->cascadeOnDelete();
            $table->string('dato_publico')->nullable();
            $table->string('dato_privado')->nullable();
            $table->string('estado', 30)->default('disponible');
            $table->foreignId('id_canje')->nullable()->constrained('canjes')->nullOnDelete();
            $table->index('id_premio');
            $table->index('id_canje');
        });

        Schema::create('respuestas_examen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id');
            $table->foreignId('examen_id');
            $table->string('nivel', 20);
            $table->text('respuestas');
            $table->integer('puntaje')->default(0);
            $table->timestamp('fecha_envio')->useCurrent();
        });

        Schema::create('votos_live', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno_juez');
            $table->foreignId('id_alumno_candidato');
            $table->integer('puntuacion');
            $table->string('comentario', 200)->nullable();
            $table->unique(['id_alumno_juez', 'id_alumno_candidato'], 'voto_unico');
        });
    }

    /**
     * Las tablas dependientes van primero para que rollback no pelee con FK.
     *
     * @return array<int, string>
     */
    private function tablasParaEliminar(): array
    {
        return [
            'votos_live',
            'respuestas_examen',
            'premios_stock_digital',
            'preguntas',
            'neuro_maze_stats',
            'insignias_otorgadas',
            'ia_modelos',
            'historial_movimientos',
            'entregas',
            'cuentos',
            'chat_mensajes',
            'canjes',
            'bots_alumnos',
            'team_members',
            'premios',
            'leads',
            'insignias',
            'historial_rondas',
            'examenes',
            'desafios',
            'competencia_live',
            'chat_live',
            'usuarios',
        ];
    }
};
