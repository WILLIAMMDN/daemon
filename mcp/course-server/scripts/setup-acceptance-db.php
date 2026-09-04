<?php
declare(strict_types=1);

$backendDir = realpath(__DIR__ . '/../../../backend-laravel');
if ($backendDir === false || !is_dir($backendDir)) {
    fwrite(STDERR, "Cannot find backend-laravel directory\n");
    exit(1);
}

$sqlitePath = $backendDir . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'acceptance_runner.sqlite';

if (file_exists($sqlitePath)) {
    @unlink($sqlitePath);
}
touch($sqlitePath);

putenv('APP_ENV=local');
$_ENV['APP_ENV'] = 'local';
$_SERVER['APP_ENV'] = 'local';

putenv('DAEMON_ENVIRONMENT=development');
$_ENV['DAEMON_ENVIRONMENT'] = 'development';
$_SERVER['DAEMON_ENVIRONMENT'] = 'development';

putenv('DB_CONNECTION=sqlite');
$_ENV['DB_CONNECTION'] = 'sqlite';
$_SERVER['DB_CONNECTION'] = 'sqlite';

putenv("DB_DATABASE={$sqlitePath}");
$_ENV['DB_DATABASE'] = $sqlitePath;
$_SERVER['DB_DATABASE'] = $sqlitePath;

putenv('DB_URL=');
$_ENV['DB_URL'] = '';
$_SERVER['DB_URL'] = '';

putenv('FIREBASE_PROJECT_ID=demo-daemon-test');
$_ENV['FIREBASE_PROJECT_ID'] = 'demo-daemon-test';
$_SERVER['FIREBASE_PROJECT_ID'] = 'demo-daemon-test';

putenv('FILESYSTEM_DISK=local');
putenv('UPLOADS_DISK=local');
putenv('PRIVATE_UPLOADS_DISK=local');
putenv('SUPABASE_STORAGE_BUCKET=daemon-assets-test');
putenv('SUPABASE_PRIVATE_STORAGE_BUCKET=daemon-private-test');

require $backendDir . '/vendor/autoload.php';
$app = require $backendDir . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

config([
    'database.default' => 'sqlite',
    'database.connections.sqlite.database' => $sqlitePath,
    'database.connections.sqlite.url' => null,
]);

use Illuminate\Support\Facades\Artisan;
use App\Models\Institucion;
use App\Models\Aula;
use App\Models\Usuario;
use App\Support\Autoria\AlcanceAutoria;
use Database\Seeders\IaOrigenTeensReferenceCourseSeeder;

require_once $backendDir . '/database/seeders/IaOrigenTeensReferenceCourseSeeder.php';

Artisan::call('migrate', [
    '--database' => 'sqlite',
    '--path' => realpath($backendDir . '/database/migrations'),
    '--realpath' => true,
    '--force' => true,
]);

$institucion = Institucion::create([
    'nombre' => 'DAEMON Innovation School',
    'slug' => 'daemon-innovation',
]);

$aula = Aula::create([
    'id_institucion' => $institucion->id,
    'nombre' => 'Cohorte IA Teens 2026',
    'nivel' => 'TEENS',
]);

$seeder = new IaOrigenTeensReferenceCourseSeeder();
$seeder->seedForInstitution($institucion, $aula);

$docente = Usuario::create([
    'nombre_completo' => 'Ana Autora',
    'email' => 'ana-autora@daemon.test',
    'usuario' => 'ana-autora',
    'password_hash' => bcrypt('secreto-daemon'),
    'rol' => 'docente',
    'nivel' => 'TEENS',
    'id_institucion' => $institucion->id,
    'perfil_completo' => true,
]);

$token = $docente->createToken('daemon-course-mcp', AlcanceAutoria::porDefectoMcp(), now()->addDays(90))->plainTextToken;

echo json_encode([
    'dbPath' => $sqlitePath,
    'token' => $token,
    'institutionId' => $institucion->id,
    'actorId' => $docente->id,
], JSON_UNESCAPED_SLASHES);
