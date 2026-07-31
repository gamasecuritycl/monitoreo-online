/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - SERVIDOR WHATSAPP v3.1 (DEPRECATION STUB)
 * ═══════════════════════════════════════════════════════════════════════
 *  NOTA: Este archivo está DEPRECADO.
 *  La única copia CANÓNICA del servidor WhatsApp vive en:
 *    SCORPION_DEPLOY/WHATSAPP_SERVER/whatsapp_server.js
 *
 *  Para iniciar el servidor, usa:
 *    cd SCORPION_DEPLOY/WHATSAPP_SERVER && node whatsapp_server.js
 * ═══════════════════════════════════════════════════════════════════════
 */

const { spawn } = require('child_process')
const path = require('path')

const SERVER_DIR = path.join(__dirname, '..', 'SCORPION_DEPLOY', 'WHATSAPP_SERVER')
const SERVER_JS  = path.join(SERVER_DIR, 'whatsapp_server.js')

const cp = spawn('node', [SERVER_JS], {
  cwd: SERVER_DIR,
  stdio: 'inherit',
  env: { ...process.env }
})

cp.on('exit', (code) => {
  console.error(`[whatsapp_server.js] Copia canónica terminó con código ${code}`)
  process.exit(code)
})

process.on('SIGINT', () => { cp.kill('SIGINT'); process.exit() })
process.on('SIGTERM', () => { cp.kill('SIGTERM'); process.exit() })
