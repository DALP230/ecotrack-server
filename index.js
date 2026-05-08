const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// CAMBIO AQUÍ: Usamos connectionString en lugar de piezas separadas
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Esto es obligatorio para que Render conecte con Neon
  }
});

pool.query('SELECT NOW()', (err) => {
  if (err) console.error("❌ Error de BD:", err.message);
  else console.log("🐘 Conexión a PostgreSQL (Neon) exitosa.");
});

// --- RUTA PARA GUARDAR REGISTROS (AHORA INSERTA EN NEON) ---
app.post('/api/registros', async (req, res) => {
  const { luz, agua, organicos, inorganicos, otros } = req.body;
  try {
    const query = `
      INSERT INTO registros (empresa_id, luz, agua, organicos, inorganicos, otros, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `;
    // Usamos empresa_id = 1 por defecto
    await pool.query(query, [1, luz, agua, organicos, inorganicos, otros]);
    
    res.json({ success: true, message: "Datos guardados en Neon" });
  } catch (err) {
    console.error("❌ Error al insertar:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- RUTA PARA OBTENER EL HISTORIAL (NUEVA) ---
app.get('/api/registros', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM registros ORDER BY fecha_registro DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// --- RUTA DE REGISTRO ---
app.post('/api/register', async (req, res) => {
  const { nombre, correo, password } = req.body;
  try {
    const query = `
      INSERT INTO usuarios (empresa_id, nombre, correo, password, rol, acepto_privacidad, fecha_registro) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `;
    await pool.query(query, [1, nombre, correo, password, 'administrador', true]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Usamos el puerto que nos asigne Render o el 3001 por defecto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor EcoTrack corriendo en puerto ${PORT}`));