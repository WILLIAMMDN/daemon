<?php

namespace Database\Seeders;

use App\Enums\TipoExperienciaAprendizaje;
use App\Models\Aula;
use App\Models\Curso;
use App\Models\ExperienciaAprendizaje;
use App\Models\HitoAprendizaje;
use App\Models\Institucion;
use App\Models\Leccion;
use App\Models\ObjetivoAprendizaje;
use App\Models\RutaAprendizaje;
use App\Models\UnidadCurso;
use App\Models\VersionCurso;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeder oficial del curso de referencia V1: IA: Origen (Teens).
 *
 * Crea la estructura completa en el Learning Core:
 * - Curso, Versión publicada inmutable (IA_ORIGEN_TEENS_2026_V1)
 * - 6 Unidades y Lecciones correspondientes
 * - 6 Objetivos de Aprendizaje (AI-01 a AI-06)
 * - Ruta de aprendizaje publicada
 * - 6 Hitos secuenciales con prerrequisitos encadenados
 * - 18 Experiencias completas con contenido instructivo real en español
 */
class IaOrigenTeensReferenceCourseSeeder extends Seeder
{
    public function run(): void
    {
        $institucion = Institucion::first() ?? Institucion::create([
            'nombre' => 'DAEMON Academy',
            'slug' => 'daemon-academy',
        ]);

        $this->seedForInstitution($institucion);
    }

    public function seedForInstitution(Institucion $institucion, ?Aula $aula = null): array
    {
        return DB::transaction(function () use ($institucion, $aula): array {
            // 1. Curso
            $curso = Curso::updateOrCreate(
                [
                    'id_institucion' => $institucion->id,
                    'codigo' => 'IA-ORIGEN-TEENS',
                ],
                [
                    'sourced_id' => (string) Str::uuid(),
                    'titulo' => 'IA: Origen',
                    'descripcion' => 'Entiende, dirige, verifica y crea con inteligencia artificial.',
                    'nivel' => 'TEENS',
                    'estado' => 'published',
                    'publicado_at' => now(),
                    'version' => 1,
                ],
            );

            // 2. Objetivos de Aprendizaje (AI-01 a AI-06)
            $objetivos = $this->crearObjetivos($institucion);

            // 3. Versión del Curso (en borrador mientras se asocian unidades)
            $version = VersionCurso::firstOrCreate(
                [
                    'id_curso' => $curso->id,
                    'numero' => 1,
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'titulo' => 'IA_ORIGEN_TEENS_2026_V1',
                    'descripcion' => 'Versión canónica de referencia para adolescentes de 13 a 17 años.',
                    'audiencia' => 'TEENS',
                    'etapa' => 'inicial',
                    'estado' => 'draft',
                ],
            );

            // 4. Ruta de Aprendizaje (en borrador mientras se configuran hitos y experiencias)
            $ruta = RutaAprendizaje::firstOrCreate(
                [
                    'id_institucion' => $institucion->id,
                    'id_curso' => $curso->id,
                    'id_version_curso' => $version->id,
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'titulo' => 'IA: Origen',
                    'descripcion' => 'Ruta de aprendizaje troncal: alfabetización, dirección crítica, verificación y creación asistida por IA.',
                    'audiencia' => 'TEENS',
                    'etapa' => 'inicial',
                    'estado' => 'draft',
                ],
            );

            // 5. Unidades y Lecciones
            $unidades = $this->crearUnidadesYLecciones($curso, $version, $objetivos);

            // 6. Hitos y Experiencias de Aprendizaje
            $hitos = $this->crearHitosYExperiencias($ruta, $unidades, $objetivos);

            // 7. Prerrequisitos secuenciales: M1 -> M2 -> M3 -> M4 -> M5 -> M6
            $this->vincularPrerrequisitos($hitos);

            // 8. Publicar Versión, Unidades, Lecciones y Ruta
            $version->update(['estado' => 'published', 'publicado_at' => now()]);
            $ruta->update(['estado' => 'published', 'publicado_at' => now()]);

            foreach ($unidades as $uData) {
                $uData['unidad']->update(['estado' => 'published']);
                foreach ($uData['lecciones'] as $leccion) {
                    $leccion->update(['estado' => 'published']);
                }
            }

            // 9. Si se suministró un aula, vincularla con la versión y ruta
            if ($aula) {
                $aula->update([
                    'id_version_curso' => $version->id,
                    'id_curso' => $curso->id,
                ]);
            }

            return compact('curso', 'version', 'ruta', 'unidades', 'hitos', 'objetivos');
        });
    }

    /**
     * Crea los 6 objetivos canónicos AI-01 a AI-06.
     *
     * @return array<string, ObjetivoAprendizaje>
     */
    private function crearObjetivos(Institucion $institucion): array
    {
        $definiciones = [
            'AI-01' => [
                'titulo' => 'Comprender mecanismos fundamentales de la IA',
                'descripcion' => 'Explica la relación entre datos, entrenamiento, modelo, entrada, inferencia y salida; distingue automatización por reglas, machine learning e IA generativa.',
            ],
            'AI-02' => [
                'titulo' => 'Dirigir y especificar tareas para IA generativa',
                'descripcion' => 'Construye y mejora iterativamente instrucciones para una IA generativa usando contexto, tarea, restricciones, ejemplos, formato y criterios de éxito.',
            ],
            'AI-03' => [
                'titulo' => 'Evaluar críticamente respuestas de IA',
                'descripcion' => 'Evalúa respuestas generadas por IA mediante criterios explícitos de pertinencia, supuestos no fundamentados y calidad general.',
            ],
            'AI-04' => [
                'titulo' => 'Verificar afirmaciones y contrastar fuentes',
                'descripcion' => 'Verifica afirmaciones factuales generadas por IA usando fuentes confiables e independientes, reconociendo el riesgo de alucinación e incertidumbre.',
            ],
            'AI-05' => [
                'titulo' => 'Uso responsable, privacidad y criterio humano',
                'descripcion' => 'Razona sobre privacidad, datos sensibles (PII), sesgo algorítmico, medios sintéticos/deepfakes, integridad académica y responsabilidad humana.',
            ],
            'AI-06' => [
                'titulo' => 'Diseñar y defender soluciones asistidas por IA',
                'descripcion' => 'Diseña, prueba, itera y defiende una solución asistida por IA para un problema real manteniendo trazabilidad de las decisiones humanas.',
            ],
        ];

        $objetivos = [];
        foreach ($definiciones as $codigo => $datos) {
            $objetivos[$codigo] = ObjetivoAprendizaje::firstOrCreate(
                [
                    'id_institucion' => $institucion->id,
                    'codigo' => $codigo,
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'descripcion' => $datos['titulo'].': '.$datos['descripcion'],
                    'marco' => 'DAEMON_ARC',
                    'nivel' => 'TEENS',
                ],
            );
        }

        return $objetivos;
    }

    /**
     * Crea las 6 unidades curriculares y sus lecciones.
     */
    private function crearUnidadesYLecciones(Curso $curso, VersionCurso $version, array $objetivos): array
    {
        $titulosUnidades = [
            1 => 'Unidad 1: ¿La IA piensa?',
            2 => 'Unidad 2: ¿Por qué la IA responde eso?',
            3 => 'Unidad 3: ¿Puedes creerle a una respuesta que suena perfecta?',
            4 => 'Unidad 4: ¿Qué deberías delegar a una IA?',
            5 => 'Unidad 5: ¿Qué problema vale la pena resolver?',
            6 => 'Unidad 6: ¿Funciona de verdad?',
        ];

        $unidades = [];
        foreach ($titulosUnidades as $orden => $titulo) {
            $unidad = UnidadCurso::firstOrCreate(
                [
                    'id_curso' => $curso->id,
                    'id_version_curso' => $version->id,
                    'orden' => $orden,
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'titulo' => $titulo,
                    'descripcion' => "Desarrollo conceptual y actividades correspondientes a la etapa {$orden}.",
                    'estado' => 'draft',
                ],
            );

            // Crear lección troncal de la unidad
            $lecciones = [];
            $leccionData = $this->obtenerDatosLeccionUnidad($orden);
            if ($leccionData) {
                $leccion = Leccion::firstOrCreate(
                    [
                        'id_unidad' => $unidad->id,
                        'orden' => 1,
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'titulo' => $leccionData['titulo'],
                        'resumen' => $leccionData['resumen'],
                        'contenido' => $leccionData['contenido'],
                        'duracion_minutos' => $leccionData['duracion_minutos'],
                        'estado' => 'draft',
                    ],
                );
                if (isset($leccionData['objetivo']) && isset($objetivos[$leccionData['objetivo']])) {
                    $leccion->objetivos()->syncWithoutDetaching([$objetivos[$leccionData['objetivo']]->id]);
                }
                $lecciones[] = $leccion;
            }

            $unidades[$orden] = [
                'unidad' => $unidad,
                'lecciones' => $lecciones,
            ];
        }

        return $unidades;
    }

    /**
     * Datos pedagógicos en español para las lecciones formativas troncales.
     */
    private function obtenerDatosLeccionUnidad(int $unidadOrden): ?array
    {
        switch ($unidadOrden) {
            case 1:
                return [
                    'titulo' => 'IA no es magia',
                    'resumen' => 'Reglas fijas vs. patrones aprendidos: comprende el flujo real datos → modelo → inferencia.',
                    'duracion_minutos' => 25,
                    'objetivo' => 'AI-01',
                    'contenido' => [
                        'tipo' => 'leccion_estructurada',
                        'bloques' => [
                            ['tipo' => 'concepto', 'texto' => 'La inteligencia artificial no "sabe", no "piensa" ni siente curiosidad. A diferencia de un programa tradicional basado en reglas ("si pasa A, haz B"), los modelos de aprendizaje automático descubren patrones probabilísticos a partir de grandes volúmenes de datos.'],
                            ['tipo' => 'ejemplo', 'titulo' => 'Reglas vs. Aprendizaje', 'texto' => 'Un corrector ortográfico clásico busca en un diccionario fijo (reglas). Un modelo de lenguaje calcula qué palabra es estadísticamente más probable que continúe una oración.'],
                            ['tipo' => 'flujo', 'pasos' => ['1. Datos recolectados', '2. Entrenamiento para ajustar pesos', '3. Modelo resultante', '4. Entrada (prompt/datos)', '5. Inferencia probabilística', '6. Salida generada']],
                            ['tipo' => 'llamado', 'titulo' => 'Desmitificación clave', 'texto' => 'La fluidez gramatical de una IA no equivale a comprensión ni veracidad.'],
                        ],
                    ],
                ];
            case 2:
                return [
                    'titulo' => 'De una idea vaga a una instrucción verificable',
                    'resumen' => 'Estructura canónica de especificación de tareas para modelos generativos.',
                    'duracion_minutos' => 30,
                    'objetivo' => 'AI-02',
                    'contenido' => [
                        'tipo' => 'leccion_estructurada',
                        'bloques' => [
                            ['tipo' => 'concepto', 'texto' => 'No existen "prompts mágicos" ni fórmulas secretas. Dirigir una IA consiste en especificar con precisión el contexto, la tarea, las restricciones y los criterios de evaluación.'],
                            ['tipo' => 'ejemplo', 'titulo' => 'Comparativa de especificación', 'debil' => 'Escribe algo sobre la fotosíntesis para niños.', 'estructurado' => 'Actúa como docente de ciencias de secundaria. Explica qué es la fotosíntesis a estudiantes de 12 años usando una analogía con una cocina solar. Máximo 150 palabras. Sin fórmulas químicas complejas. Incluye 2 preguntas de autoevaluación al final.'],
                            ['tipo' => 'pasos', 'titulo' => 'Los 6 componentes de una instrucción efectiva', 'pasos' => ['1. Contexto y rol', '2. Tarea concreta', '3. Restricciones de formato y extensión', '4. Ejemplos o referencias', '5. Formato de salida esperado', '6. Criterios de éxito verificables']],
                        ],
                    ],
                ];
            case 3:
                return [
                    'titulo' => 'Convincente no significa correcto',
                    'resumen' => 'Alucinaciones, fuentes fabricadas y por qué la certeza del tono oculta errores probabilísticos.',
                    'duracion_minutos' => 25,
                    'objetivo' => 'AI-03',
                    'contenido' => [
                        'tipo' => 'leccion_estructurada',
                        'bloques' => [
                            ['tipo' => 'concepto', 'texto' => 'Los modelos de lenguaje están diseñados para generar secuencias de texto plausibles, no para consultar una enciclopedia de hechos verificados en tiempo real. Por eso pueden inventar autores, fechas, citas o explicaciones completas con absoluta convicción.'],
                            ['tipo' => 'ejemplo', 'titulo' => 'La trampa de las citas fabricadas', 'texto' => 'Si le pides a una IA "3 artículos científicos que demuestren que los gatos vuelan", es probable que redacte títulos creíbles con nombres de universidades reales y años recientes que no existen en ningún repositorio científico.'],
                            ['tipo' => 'metodo', 'titulo' => 'Triangulación de fuentes', 'texto' => 'Toda afirmación factual importante debe contrastarse con al menos dos fuentes independientes de autoridad antes de ser aceptada.'],
                        ],
                    ],
                ];
            case 4:
                return [
                    'titulo' => 'La decisión sigue siendo humana',
                    'resumen' => 'Privacidad, datos sensibles, sesgos algorítmicos y el valor intransferible del criterio personal.',
                    'duracion_minutos' => 25,
                    'objetivo' => 'AI-05',
                    'contenido' => [
                        'tipo' => 'leccion_estructurada',
                        'bloques' => [
                            ['tipo' => 'concepto', 'texto' => 'Delegar una tarea a la IA no te exime de la responsabilidad sobre el resultado final. Todo contenido que publicas o entregas bajo tu nombre lleva tu firma ética y académica.'],
                            ['tipo' => 'privacidad', 'titulo' => '¿Qué NO debes compartir nunca con una IA externa?', 'elementos' => ['Nombres completos de familiares o compañeros', 'Teléfonos, direcciones o correos privados', 'Fotografías personales o de menores sin consentimiento', 'Información médica o psicológica', 'Contraseñas o documentos institucionales privados']],
                            ['tipo' => 'criterio', 'titulo' => 'La regla de oro', 'texto' => 'La IA puede ayudarte a explorar opciones, estructurar borradores y comparar enfoques; la decisión, la verificación y el juicio final son siempre humanos.'],
                        ],
                    ],
                ];
            case 5:
                return [
                    'titulo' => 'Diseño de soluciones humano–IA',
                    'resumen' => 'Metodología para delimitar problemas reales y definir qué rol asume la IA y qué rol asumes tú.',
                    'duracion_minutos' => 30,
                    'objetivo' => 'AI-06',
                    'contenido' => [
                        'tipo' => 'leccion_estructurada',
                        'bloques' => [
                            ['tipo' => 'concepto', 'texto' => 'Un buen proyecto Capstone no consiste en "crear algo con IA para ver qué sale", sino en resolver una dificultad real en tu colegio, comunidad, método de estudio u organización diaria.'],
                            ['tipo' => 'estructura', 'titulo' => 'El Project Brief', 'campos' => ['1. Problema identificado y usuario que lo sufre', '2. Por qué importa resolverlo', '3. Rol de la IA (¿qué asiste?)', '4. Rol humano (¿qué decides y auditas tú?)', '5. Datos que se usarán y salvaguardas de privacidad']],
                        ],
                    ],
                ];
            case 6:
                return [
                    'titulo' => 'Pruebas de estrés y defensa de decisiones',
                    'resumen' => 'Cómo validar tu solución ante casos difíciles, fallas adversariales y preparar tu defensa.',
                    'duracion_minutos' => 30,
                    'objetivo' => 'AI-06',
                    'contenido' => [
                        'tipo' => 'leccion_estructurada',
                        'bloques' => [
                            ['tipo' => 'concepto', 'texto' => 'Ningún sistema de IA está listo hasta que se prueba con entradas confusas, incompletas o deliberadamente ambiguas. Las fallas descubiertas son la evidencia más valiosa de tu aprendizaje.'],
                            ['tipo' => 'defensa', 'preguntas' => ['¿Qué problema resolviste?', '¿Por qué decidiste usar IA en este punto específico?', '¿Dónde se equivocó la IA y cómo lo corregiste?', '¿Qué medidas de privacidad tomaste?', '¿Qué harías diferente en la siguiente versión?']],
                        ],
                    ],
                ];
            default:
                return null;
        }
    }

    /**
     * Crea los 6 hitos con sus 18 experiencias completas.
     *
     * @return array<int, HitoAprendizaje>
     */
    private function crearHitosYExperiencias(RutaAprendizaje $ruta, array $unidades, array $objetivos): array
    {
        $hitosData = [
            1 => [
                'titulo' => '¿La IA piensa?',
                'descripcion' => 'Desarma el pensamiento mágico: comprende qué es un modelo, cómo se entrena y cómo infiere a partir de datos.',
                'experiencias' => [
                    [
                        'tipo' => TipoExperienciaAprendizaje::LECCION,
                        'titulo' => 'IA no es magia',
                        'descripcion' => 'Aprende la diferencia entre reglas fijas y patrones probabilísticos aprendidos a partir de datos.',
                        'orden' => 1,
                        'obligatoria' => true,
                        'permite_intentos' => false,
                        'regla_completitud' => ['modo' => 'lesson_completion'],
                        'objetivos' => ['AI-01'],
                        'leccion_index' => 0,
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::LABORATORIO,
                        'titulo' => 'Entrena, prueba y rompe un modelo simple',
                        'descripcion' => 'Experimenta con clasificación visual y prueba qué ocurre cuando los datos de entrenamiento están desbalanceados o incompletos.',
                        'orden' => 2,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-01'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'laboratorio_guiado',
                            'herramienta_sugerida' => 'Teachable Machine o clasificador visual de demostración (sin cuenta requerida)',
                            'preguntas_informe' => [
                                '¿Qué clases entrenaste y cuántos ejemplos utilizaste?',
                                '¿Qué ocurrió cuando probaste un ejemplo ambiguo o con iluminación distinta?',
                                '¿Por qué crees que el modelo falló o acertó?',
                                '¿Qué limitación del aprendizaje automático demostró este experimento?',
                            ],
                            'instrucciones' => 'Realiza tu experimento individual o con apoyo docente y registra tus conclusiones en la bitácora de entrega.',
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::MISION,
                        'titulo' => 'Radiografía de una IA cotidiana',
                        'descripcion' => 'Elige una aplicación de IA de tu vida diaria y descompón su funcionamiento en entrada, datos, modelo y posibles fallas.',
                        'orden' => 3,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-01', 'AI-05'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'analisis_sistema',
                            'campos_requeridos' => [
                                'Sistema elegido (ej. recomendador de música, filtro fotográfico, autocorrector)',
                                '¿Qué datos de entrada recibe?',
                                '¿Qué patrones probabilísticos intenta predecir el modelo?',
                                '¿Qué salida entrega al usuario?',
                                '¿Qué error común o sesgo puede presentar este sistema?',
                                '¿Quién es responsable si el sistema comete un error perjudicial?',
                            ],
                        ],
                    ],
                ],
            ],
            2 => [
                'titulo' => '¿Por qué la IA responde eso?',
                'descripcion' => 'Aprende a comunicarte eficazmente con modelos generativos mediante especificaciones estructuradas de tareas.',
                'experiencias' => [
                    [
                        'tipo' => TipoExperienciaAprendizaje::LECCION,
                        'titulo' => 'De una idea vaga a una instrucción verificable',
                        'descripcion' => 'Domina los 6 componentes esenciales de una especificación de tarea para obtener resultados precisos.',
                        'orden' => 1,
                        'obligatoria' => true,
                        'permite_intentos' => false,
                        'regla_completitud' => ['modo' => 'lesson_completion'],
                        'objetivos' => ['AI-02'],
                        'leccion_index' => 0,
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::PRACTICA,
                        'titulo' => 'Mejora la instrucción',
                        'descripcion' => 'Diagnostica instrucciones deficientes e imprecisas y reescríbelas aplicando restricciones y criterios de éxito.',
                        'orden' => 2,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-02', 'AI-03'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'diagnostico_y_refactor',
                            'casos' => [
                                'Caso A: "Haz un resumen de la historia de Roma."',
                                'Caso B: "Explícame matemáticas para un examen."',
                                'Caso C: "Escribe una historia de ciencia ficción."',
                            ],
                            'instrucciones' => 'Para cada caso: explica qué le falta y redacta la instrucción mejorada usando Contexto + Tarea + Restricciones + Formato.',
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::MISION,
                        'titulo' => 'Tres intentos, una mejor decisión',
                        'descripcion' => 'Ejecuta una tarea generativa registrando tres versiones sucesivas y justificando el razonamiento de cada iteración.',
                        'orden' => 3,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-02', 'AI-03'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'bitacora_iteracion',
                            'requisitos' => [
                                'Versión 1: Instrucción inicial y resultado obtenido.',
                                'Versión 2: Qué cambiaste, por qué y qué mejoró.',
                                'Versión 3: Ajuste final de restricciones y evaluación de la respuesta.',
                                'Conclusión: ¿Por qué la versión 3 es superior según tus criterios de éxito?',
                            ],
                        ],
                    ],
                ],
            ],
            3 => [
                'titulo' => '¿Puedes creerle a una respuesta que suena perfecta?',
                'descripcion' => 'Desarrolla pensamiento crítico: detecta alucinaciones, evalúa solidez de fuentes y aplica verificación rigurosa.',
                'experiencias' => [
                    [
                        'tipo' => TipoExperienciaAprendizaje::LECCION,
                        'titulo' => 'Convincente no significa correcto',
                        'descripcion' => 'Comprende los mecanismos de las alucinaciones y por qué los modelos inventan datos con tono de seguridad.',
                        'orden' => 1,
                        'obligatoria' => true,
                        'permite_intentos' => false,
                        'regla_completitud' => ['modo' => 'lesson_completion'],
                        'objetivos' => ['AI-03', 'AI-04'],
                        'leccion_index' => 0,
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::DESAFIO,
                        'titulo' => 'Detective de respuestas',
                        'descripcion' => 'Examina un texto generado con afirmaciones mixtas y clasifica cada dato en: verificado, dudoso o falso.',
                        'orden' => 2,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-03', 'AI-04'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'clasificacion_critica',
                            'instrucciones' => 'Analiza las 4 afirmaciones del caso provisto. Para cada una, indica tu clasificación (Verificada / Dudosa / Falsa / Sin evidencia) y explica tu razonamiento.',
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::EVALUACION,
                        'titulo' => 'Verifica antes de repetir',
                        'descripcion' => 'Extrae afirmaciones factuales de una respuesta de IA, contrástalas con fuentes independientes y redacta la corrección.',
                        'orden' => 3,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-04', 'AI-05'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'informe_verificacion',
                            'campos' => [
                                '3 afirmaciones extraídas de la respuesta analizada',
                                'Fuentes independientes consultadas para contrastar (con URL o nombre)',
                                'Veredicto de cada afirmación y corrección de datos inexactos',
                                'Nota de incertidumbre y grado de confianza final',
                            ],
                        ],
                    ],
                ],
            ],
            4 => [
                'titulo' => '¿Qué deberías delegar a una IA?',
                'descripcion' => 'Uso responsable, protección de privacidad, identificación de sesgos y preservación del criterio humano.',
                'experiencias' => [
                    [
                        'tipo' => TipoExperienciaAprendizaje::LECCION,
                        'titulo' => 'La decisión sigue siendo humana',
                        'descripcion' => 'Aprende a evaluar riesgos éticos, privacidad de datos personales y límites de la delegación.',
                        'orden' => 1,
                        'obligatoria' => true,
                        'permite_intentos' => false,
                        'regla_completitud' => ['modo' => 'lesson_completion'],
                        'objetivos' => ['AI-05'],
                        'leccion_index' => 0,
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::LABORATORIO,
                        'titulo' => 'Compara, cuestiona, decide',
                        'descripcion' => 'Compara dos respuestas ante un mismo dilema ético, analiza sus sesgos y define la postura humana fundamentada.',
                        'orden' => 2,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-03', 'AI-05'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'laboratorio_etico',
                            'entregables' => [
                                'Tabla comparativa de respuesta A vs. respuesta B',
                                'Sesgos o supuestos identificados en cada una',
                                'Decisión y postura humana fundamentada',
                            ],
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::MISION,
                        'titulo' => 'Crea algo útil sin entregar tu criterio',
                        'descripcion' => 'Construye un recurso educativo o práctico asistido por IA, documentando qué aportó la IA y qué decidiste tú.',
                        'orden' => 3,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-02', 'AI-05'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'declaracion_colaboracion',
                            'preguntas' => [
                                '¿Qué creaste y para quién es útil?',
                                '¿Qué ideas o borradores iniciales propuso la IA?',
                                '¿Qué sugerencias de la IA rechazaste o modificaste y por qué?',
                                '¿Cómo aseguraste que no se incluyeran datos sensibles?',
                            ],
                        ],
                    ],
                ],
            ],
            5 => [
                'titulo' => '¿Qué problema vale la pena resolver?',
                'descripcion' => 'Fase 1 del Proyecto Capstone: definición del problema real, arquitectura del flujo humano–IA y pruebas iniciales.',
                'experiencias' => [
                    [
                        'tipo' => TipoExperienciaAprendizaje::PROYECTO,
                        'titulo' => 'Capstone 1 — Define el problema',
                        'descripcion' => 'Redacta el Project Brief: define el problema real que abordarás, el usuario objetivo y los límites de la IA.',
                        'orden' => 1,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-06'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'project_brief',
                            'campos' => [
                                'Problema identificado (escuela, comunidad, estudio personal, etc.)',
                                '¿Quién se beneficia con la solución?',
                                '¿En qué tareas específicas ayudará la IA?',
                                '¿En qué momentos se requiere juicio humano obligatorio?',
                                'Declaración de seguridad de datos (no PII)',
                            ],
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::MISION,
                        'titulo' => 'Diseña el flujo humano–IA',
                        'descripcion' => 'Mapea la secuencia paso a paso indicando qué hace la persona, qué genera la IA y dónde se auditan los resultados.',
                        'orden' => 2,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-02', 'AI-05', 'AI-06'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'flujo_trabajo',
                            'pasos_requeridos' => [
                                'Paso humano inicial (definir objetivos, recolectar datos seguros)',
                                'Paso de asistencia de IA (generar borrador, ordenar información)',
                                'Punto de control humano (verificación, filtro de sesgos, edición)',
                                'Paso final (aplicación y validación con usuarios)',
                            ],
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::PROYECTO,
                        'titulo' => 'Capstone 2 — Prueba antes de confiar',
                        'descripcion' => 'Diseña 3 casos de prueba rigurosos (normal, ambiguo y de falla) para verificar la robustez de tu solución.',
                        'orden' => 3,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-03', 'AI-04', 'AI-06'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'matriz_pruebas',
                            'casos' => [
                                'Caso 1 (Entrada típica): Resultado esperado vs. resultado real.',
                                'Caso 2 (Entrada ambigua o incompleta): Cómo reaccionó el sistema.',
                                'Caso 3 (Entrada tramposa o de falla): Qué error se detectó y qué ajuste se realizó.',
                            ],
                        ],
                    ],
                ],
            ],
            6 => [
                'titulo' => '¿Funciona de verdad?',
                'descripcion' => 'Fase 2 del Proyecto Capstone: construcción final, defensa socrática y paquete de entrega integral.',
                'experiencias' => [
                    [
                        'tipo' => TipoExperienciaAprendizaje::PROYECTO,
                        'titulo' => 'Construye, prueba y mejora',
                        'descripcion' => 'Finaliza la solución aplicando al menos una corrección significativa derivada de tus pruebas del Hito 5.',
                        'orden' => 1,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-06'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'producto_revisado',
                            'elementos' => [
                                'Artefacto final o enlace al prototipo',
                                'Registro de cambios post-pruebas (qué falla encontraste y cómo la resolviste)',
                                'Limitaciones conocidas del artefacto',
                            ],
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::EVALUACION,
                        'titulo' => 'Defiende tus decisiones',
                        'descripcion' => 'Responde a las preguntas críticas de auditoría: justifica por qué usaste IA y demuestra dominio sobre tu trabajo.',
                        'orden' => 2,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-01', 'AI-05', 'AI-06'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'defensa_conceptual',
                            'preguntas_clave' => [
                                '1. ¿Qué problema resolviste y por qué era necesario?',
                                '2. ¿Qué parte del trabajo fue 100% humana y qué parte fue asistida por IA?',
                                '3. ¿Qué alucinación, error o sesgo encontraste durante el proceso y cómo lo detectaste?',
                                '4. ¿En qué escenario recomendarías NO utilizar IA para esta tarea?',
                            ],
                        ],
                    ],
                    [
                        'tipo' => TipoExperienciaAprendizaje::PROYECTO,
                        'titulo' => 'Entrega final — Lo que construí y lo que aprendí',
                        'descripcion' => 'Compila tu portafolio completo: Project Brief, flujo de trabajo, matriz de pruebas, producto y ensayo reflexivo.',
                        'orden' => 3,
                        'obligatoria' => true,
                        'permite_intentos' => true,
                        'regla_completitud' => ['modo' => 'submission'],
                        'objetivos' => ['AI-01', 'AI-02', 'AI-03', 'AI-04', 'AI-05', 'AI-06'],
                        'guia_entrega' => [
                            'tipo_actividad' => 'portafolio_capstone_final',
                            'rubrica_referencia' => [
                                'Definición del problema',
                                'Diseño del rol Humano–IA',
                                'Alfabetización en IA y reconocimiento de límites',
                                'Evaluación crítica y verificación factual',
                                'Trazabilidad de iteración y pruebas de estrés',
                                'Uso responsable y privacidad de datos',
                                'Calidad y funcionalidad del artefacto',
                                'Defensa autónoma de decisiones',
                                'Reflexión metacognitiva final',
                            ],
                            'instrucciones' => 'Presenta tu paquete integral de proyecto acompañado de tu reflexión personal sobre cómo cambió tu relación con la inteligencia artificial.',
                        ],
                    ],
                ],
            ],
        ];

        $hitos = [];
        foreach ($hitosData as $orden => $hData) {
            $hito = HitoAprendizaje::firstOrCreate(
                [
                    'id_ruta' => $ruta->id,
                    'orden' => $orden,
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'titulo' => $hData['titulo'],
                    'descripcion' => $hData['descripcion'],
                    'obligatorio' => true,
                ],
            );

            $unidadRef = $unidades[$orden]['unidad'] ?? null;
            $leccionesRef = $unidades[$orden]['lecciones'] ?? [];

            foreach ($hData['experiencias'] as $expData) {
                $leccionAsociada = isset($expData['leccion_index']) && isset($leccionesRef[$expData['leccion_index']])
                    ? $leccionesRef[$expData['leccion_index']]
                    : null;

                $experiencia = ExperienciaAprendizaje::updateOrCreate(
                    [
                        'id_hito' => $hito->id,
                        'orden' => $expData['orden'],
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'id_unidad' => $unidadRef?->id,
                        'tipo' => $expData['tipo'],
                        'titulo' => $expData['titulo'],
                        'descripcion' => $expData['descripcion'],
                        'contenido' => $leccionAsociada?->contenido ?? ['resumen' => $expData['descripcion']],
                        'origen_tipo' => $leccionAsociada ? 'leccion' : null,
                        'origen_id' => $leccionAsociada?->id,
                        'obligatoria' => $expData['obligatoria'],
                        'permite_intentos' => $expData['permite_intentos'],
                        'regla_completitud' => $expData['regla_completitud'],
                        'guia_entrega' => $expData['guia_entrega'] ?? null,
                        'estado' => 'draft',
                    ],
                );

                // Vincular objetivos de aprendizaje a la experiencia
                $objIds = [];
                foreach ($expData['objetivos'] as $codObj) {
                    if (isset($objetivos[$codObj])) {
                        $objIds[] = $objetivos[$codObj]->id;
                    }
                }
                if (! empty($objIds)) {
                    $experiencia->objetivos()->syncWithoutDetaching($objIds);
                }
            }

            $hitos[$orden] = $hito;
        }

        return $hitos;
    }

    /**
     * Vincula los hitos secuencialmente: M(i) requiere M(i-1).
     *
     * @param array<int, HitoAprendizaje> $hitos
     */
    private function vincularPrerrequisitos(array $hitos): void
    {
        for ($i = 2; $i <= 6; $i++) {
            if (isset($hitos[$i]) && isset($hitos[$i - 1])) {
                $hitos[$i]->prerrequisitos()->syncWithoutDetaching([$hitos[$i - 1]->id]);
            }
        }
    }
}
