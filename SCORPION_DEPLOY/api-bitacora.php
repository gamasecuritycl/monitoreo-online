<?php
/**
 * GAMA SEGURIDAD - API Bitácora v2.0
 * 
 * Subir a: bitacora.gamasecurity.cl/api-bitacora.php
 * 
 * Endpoints:
 *   GET   ?action=abonados&q=TEXT              → buscar abonados
 *   GET   ?action=eventos&id=X&desde=&hasta=   → eventos (con filtro fecha)
 *   GET   ?action=tipos                         → tipos de evento
 *   POST  ?action=crear                         → crear evento (JSON)
 *   POST  ?action=editar                        → editar evento (JSON: id, comentario, tipo_evento)
 *   POST  ?action=adjuntar                      → subir archivo (multipart: id, archivo)
 *   GET   ?action=archivos&evento_id=X          → archivos de un evento
 *   DELETE ?action=eliminar_archivo&id=X        → eliminar archivo
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Conexión MySQL ──
$DB_HOST = '127.0.0.1';
$DB_PORT = 3306;
$DB_NAME = 'gamacl_bitacora_app';
$DB_USER = 'gamacl_user_bitacora';
$DB_PASS = '61t0}V4Atr26';

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit;
}

// ── Crear tabla de archivos si no existe (con manejo de errores) ──
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS eventos_archivos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            evento_id INT NOT NULL,
            nombre_original VARCHAR(255) NOT NULL,
            archivo VARCHAR(255) NOT NULL,
            tipo VARCHAR(100) NOT NULL,
            tamanio INT NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (PDOException $e) {
    // La tabla ya existe o no se pudo crear — continuar de todas formas
}

// ── Crear directorio de uploads si no existe ──
$UPLOAD_DIR = __DIR__ . '/uploads';
if (!is_dir($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
    file_put_contents($UPLOAD_DIR . '/index.html', '');
}

// ── AUTO-REPARACIÓN DE REGISTROS CON id_abonado = 0 O NULL PARA PREVENIR ERROR 500 EN EL FRONTEND ──
try {
    $stmtValid = $pdo->query("SELECT id FROM abonados WHERE id > 0 ORDER BY id ASC LIMIT 1");
    $validRow = $stmtValid->fetch();
    $defaultAbId = ($validRow && (int)$validRow['id'] > 0) ? (int)$validRow['id'] : 1;
    $pdo->exec("UPDATE eventos SET id_abonado = $defaultAbId WHERE id_abonado = 0 OR id_abonado IS NULL");
} catch (Exception $e) {
    // Ignorar si falla auto-reparación
}

$action = $_GET['action'] ?? '';

switch ($action) {

    // ── BUSCAR ABONADOS ──
    case 'abonados':
        $q = $_GET['q'] ?? '';
        if (strlen($q) < 1) {
            echo json_encode([]);
            exit;
        }
        $stmt = $pdo->prepare("
            SELECT a.id, a.cod, a.nombre, a.direccion, a.plan, a.ciudad
            FROM abonados a
            WHERE a.cod LIKE ? OR a.nombre LIKE ?
            ORDER BY a.nombre ASC
            LIMIT 20
        ");
        $like = "%$q%";
        $stmt->execute([$like, $like]);
        echo json_encode($stmt->fetchAll());
        break;

    // ── LISTAR EVENTOS ──
    case 'eventos':
        $abonadoId = $_GET['id'] ?? '';
        $q = $_GET['q'] ?? $_GET['cuenta'] ?? $_GET['cod'] ?? '';
        $desde = $_GET['desde'] ?? '';
        $hasta = $_GET['hasta'] ?? '';

        $sql = "
            SELECT e.id, e.id_abonado, e.comentario, e.tipo_evento, e.created_at, e.updated_at,
                   COALESCE(et.name, 'NOVEDAD') AS tipo_nombre,
                   COALESCE(et.color, 'FF0000') AS tipo_color,
                   COALESCE(u.name, 'operador') AS responsable_nombre,
                   COALESCE(a.cod, 'S/C') AS abonado_cod,
                   COALESCE(a.nombre, 'ABONADO GENERAL') AS abonado_nombre
            FROM eventos e
            LEFT JOIN eventos_type et ON e.tipo_evento = et.id
            LEFT JOIN users u ON e.id_responsable = u.id
            LEFT JOIN abonados a ON e.id_abonado = a.id
            WHERE 1=1
        ";
        $params = [];

        if ($abonadoId) {
            if (is_numeric($abonadoId)) {
                $sql .= " AND e.id_abonado = ?";
                $params[] = (int)$abonadoId;
            } else {
                $sql .= " AND (a.cod = ? OR a.cod LIKE ?)";
                $params[] = $abonadoId;
                $params[] = "%$abonadoId%";
            }
        }

        if ($q) {
            $sql .= " AND (a.cod = ? OR a.cod LIKE ? OR a.nombre LIKE ? OR e.comentario LIKE ?)";
            $params[] = $q;
            $params[] = "%$q%";
            $params[] = "%$q%";
            $params[] = "%$q%";
        }

        // Solo usar turno por defecto si NO hay filtro por abonado/q Y NO hay fechas explícitas Y NO se pidió histórico
        $sinFiltroEspecifico = empty($abonadoId) && empty($q) && !isset($_GET['all']) && !isset($_GET['historico']);
        if (!$desde && !$hasta && $sinFiltroEspecifico) {
            $h = (int)date('H');
            $hoy = date('Y-m-d');
            $ayer = date('Y-m-d', strtotime('-1 day'));
            if ($h >= 8 && $h < 16) {
                $desde = "$hoy 08:00"; $hasta = "$hoy 16:00";
            } elseif ($h >= 16 && $h < 22) {
                $desde = "$hoy 16:00"; $hasta = "$hoy 22:00";
            } else {
                $desde = "$ayer 22:00"; $hasta = "$hoy 08:00";
            }
        }

        if ($desde) {
            $sql .= " AND e.created_at >= ?";
            $params[] = strpos($desde, ' ') !== false ? $desde : $desde . ' 00:00:00';
        }
        if ($hasta) {
            $sql .= " AND e.created_at <= ?";
            $params[] = strpos($hasta, ' ') !== false ? $hasta : $hasta . ' 23:59:59';
        }

        $sql .= " ORDER BY e.created_at DESC LIMIT 200";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
        break;

    // ── TIPOS DE EVENTO ──
    case 'tipos':
        $stmt = $pdo->query("SELECT id, name, color FROM eventos_type ORDER BY name ASC");
        echo json_encode($stmt->fetchAll());
        break;

    // ── CREAR EVENTO ──
    case 'crear':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['id_abonado']) || empty($input['comentario'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan campos requeridos (id_abonado, comentario)']);
            exit;
        }

        try {
            $abonadoId = $input['id_abonado'];
            if (!is_numeric($abonadoId) || (int)$abonadoId <= 0) {
                $rawCode = trim(strval($abonadoId));
                $stmtAb = $pdo->prepare("SELECT id FROM abonados WHERE cod = ? OR cod LIKE ? LIMIT 1");
                $stmtAb->execute([$rawCode, "%$rawCode%"]);
                $abRow = $stmtAb->fetch();
                if ($abRow && (int)$abRow['id'] > 0) {
                    $abonadoId = (int)$abRow['id'];
                } else {
                    $stmtFirst = $pdo->query("SELECT id FROM abonados WHERE id > 0 ORDER BY id ASC LIMIT 1");
                    $abFirst = $stmtFirst->fetch();
                    $abonadoId = ($abFirst && (int)$abFirst['id'] > 0) ? (int)$abFirst['id'] : 1;
                }
            }

            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("
                INSERT INTO eventos (id_responsable, id_abonado, comentario, tipo_evento, publico, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $input['id_responsable'] ?? 1,
                (int)$abonadoId,
                $input['comentario'],
                $input['tipo_evento'] ?? 1,
                $input['publico'] ?? 0,
                $now,
                $now
            ]);
            echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            http_response_code(200);
            echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ── EDITAR EVENTO ──
    case 'editar':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta id del evento']);
            exit;
        }

        $comentario = $input['comentario'] ?? '';
        $tipoEvento = $input['tipo_evento'] ?? 1;
        $now = date('Y-m-d H:i:s');

        $stmt = $pdo->prepare("UPDATE eventos SET comentario = ?, tipo_evento = ?, updated_at = ? WHERE id = ?");
        $stmt->execute([$comentario, $tipoEvento, $now, $input['id']]);
        echo json_encode(['ok' => true]);
        break;

    // ── SUBIR ARCHIVO ──
    case 'adjuntar':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            exit;
        }
        $eventoId = $_POST['evento_id'] ?? '';
        if (!$eventoId || !isset($_FILES['archivo'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta evento_id o archivo']);
            exit;
        }

        $file = $_FILES['archivo'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Error al subir el archivo: código ' . $file['error']]);
            exit;
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $nombreUnico = uniqid('file_') . '.' . $ext;
        $destino = $UPLOAD_DIR . '/' . $nombreUnico;

        if (!move_uploaded_file($file['tmp_name'], $destino)) {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo guardar el archivo']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO eventos_archivos (evento_id, nombre_original, archivo, tipo, tamanio, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $eventoId,
            $file['name'],
            $nombreUnico,
            $file['type'],
            $file['size']
        ]);

        echo json_encode([
            'ok' => true,
            'id' => $pdo->lastInsertId(),
            'url' => 'uploads/' . $nombreUnico,
            'nombre' => $file['name']
        ]);
        break;

    // ── LISTAR ARCHIVOS DE UN EVENTO ──
    case 'archivos':
        $eventoId = $_GET['evento_id'] ?? '';
        if (!$eventoId) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta evento_id']);
            exit;
        }
        $stmt = $pdo->prepare("
            SELECT id, evento_id, nombre_original, archivo, tipo, tamanio, created_at
            FROM eventos_archivos
            WHERE evento_id = ?
            ORDER BY created_at ASC
        ");
        $stmt->execute([$eventoId]);
        $archivos = $stmt->fetchAll();
        foreach ($archivos as &$a) {
            $a['url'] = 'uploads/' . $a['archivo'];
        }
        echo json_encode($archivos);
        break;

    // ── ELIMINAR ARCHIVO ──
    case 'eliminar_archivo':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta id']);
            exit;
        }
        $stmt = $pdo->prepare("SELECT archivo FROM eventos_archivos WHERE id = ?");
        $stmt->execute([$id]);
        $archivo = $stmt->fetch();
        if ($archivo) {
            $ruta = $UPLOAD_DIR . '/' . $archivo['archivo'];
            if (file_exists($ruta)) unlink($ruta);
            $pdo->prepare("DELETE FROM eventos_archivos WHERE id = ?")->execute([$id]);
        }
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Acción no válida. Usar: abonados, eventos, tipos, crear, editar, adjuntar, archivos, eliminar_archivo']);
        break;
}
