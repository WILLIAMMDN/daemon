<?php
require_once "config.php"; // Asegura que carga tu conexión
if (!isset($_SESSION['usuario'])) { header("Location: index.php"); exit(); }

$id_user = $_SESSION['id'];
$mensaje = "";

// GUARDAR DATOS
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $titulo = $conexion->real_escape_string($_POST['titulo']);
    
    // Arrays para guardar imágenes y JSONs
    $imgs = []; 
    $datas = [];

    for($i=1; $i<=6; $i++){
        $imgs[$i] = $_POST["hidden_img_$i"] ?? '';
        $raw_json = $_POST["data_$i"] ?? '[]';
        // Limpiar JSON para evitar errores SQL
        $datas[$i] = $conexion->real_escape_string($raw_json);
    }

    // Verificar si ya existe el cómic del alumno
    $check = $conexion->query("SELECT id FROM cuentos WHERE id_alumno = $id_user");
    
    if ($check->num_rows > 0) {
        // ACTUALIZAR
        $sql = "UPDATE cuentos SET titulo='$titulo'";
        for($j=1; $j<=6; $j++) {
            $sql .= ", img_$j='{$imgs[$j]}', data_$j='{$datas[$j]}'";
        }
        $sql .= " WHERE id_alumno=$id_user";
    } else {
        // INSERTAR NUEVO
        $sql = "INSERT INTO cuentos (id_alumno, titulo, img_1, data_1, img_2, data_2, img_3, data_3, img_4, data_4, img_5, data_5, img_6, data_6) VALUES ($id_user, '$titulo'";
        for($j=1; $j<=6; $j++) {
            $sql .= ", '{$imgs[$j]}', '{$datas[$j]}'";
        }
        $sql .= ")";
    }
    
    if($conexion->query($sql)) $mensaje = "¡Guardado con éxito! 💾";
    else $mensaje = "Error SQL: " . $conexion->error;
}

// RECUPERAR DATOS PARA MOSTRAR
$comic = $conexion->query("SELECT * FROM cuentos WHERE id_alumno = $id_user")->fetch_assoc();
?>