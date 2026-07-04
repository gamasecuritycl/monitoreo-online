<?php
/**
 * GAMA SEGURIDAD - API Bitácora
 * Conexión directa a MySQL (Laravel) para leer/escribir eventos
 * 
 * Subir a: bitacora.gamasecurity.cl/api-bitacora.php
 * 
 * Endpoints:
 *   GET  ?action=abonados&q=TEXT    → buscar abonados
 *   GET  ?action=eventos&id=X       → eventos de un abonado
 *   GET  ?action=tipos               → tipos de evento disponibles
 *   POST ?action=crear               → crear nuevo evento (JSON body)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

$action = $_GET['action'] ?? '';

switch ($action) {

    // ── BUSCAR ABONADOS (autocomplete) ──
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

    // ── LISTAR EVENTOS DE UN ABONADO ──
    case 'eventos':
        $abonadoId = $_GET['id'] ?? '';
        if (!$abonadoId) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta id_abonado']);
            exit;
        }
        $stmt = $pdo->prepare("
            SELECT e.id, e.comentario, e.tipo_evento, e.created_at, e.updated_at,
                   et.name AS tipo_nombre, et.color AS tipo_color,
                   u.name AS responsable_nombre
            FROM eventos e
            LEFT JOIN eventos_type et ON e.tipo_evento = et.id
            LEFT JOIN users u ON e.id_responsable = u.id
            WHERE e.id_abonado = ?
            ORDER BY e.created_at DESC
            LIMIT 100
        ");
        $stmt->execute([$abonadoId]);
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

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("
            INSERT INTO eventos (id_responsable, id_abonado, comentario, tipo_evento, publico, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['id_responsable'] ?? 1,
            $input['id_abonado'],
            $input['comentario'],
            $input['tipo_evento'] ?? 1,
            $input['publico'] ?? 0,
            $now,
            $now
        ]);
        echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Acción no válida. Usar: abonados, eventos, tipos, crear']);
        break;
}
