const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.query('SELECT NOW()', (err) => {
  if (err) console.error("❌ Error de BD:", err.message);
  else console.log("🐘 Conexión a PostgreSQL exitosa.");
});

// --- RUTA DE LOGIN ---
app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    const query = 'SELECT id, nombre, rol FROM usuarios WHERE correo = $1 AND password = $2';
    const result = await pool.query(query, [correo, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- RUTA DE REGISTRO (CON ROL EXACTO) ---
app.post('/api/register', async (req, res) => {
  const { nombre, correo, password } = req.body;
  try {
    const query = `
      INSERT INTO usuarios (empresa_id, nombre, correo, password, rol, acepto_privacidad, fecha_registro) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `;
    
    // ENVIAMOS 'administrador' EXACTAMENTE (como pide tu restricción CHECK)
    // También enviamos empresa_id = 1 (Asegúrate de haber creado la empresa 1 en pgAdmin)
    await pool.query(query, [1, nombre, correo, password, 'administrador', true]);
    
    console.log(`✅ Usuario registrado con éxito: ${correo}`);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ Error detallado:", err.message);
    res.status(400).json({ success: false, error: "Error en base de datos: " + err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Servidor EcoTrack corriendo en puerto ${PORT}`));