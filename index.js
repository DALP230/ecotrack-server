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

// --- RUTA PARA GUARDAR REGISTROS (La que usa tu botón GUARDAR) ---
app.post('/api/registros', async (req, res) => {
  const { luz, agua, organicos, inorganicos, otros } = req.body;
  try {
    // Aquí podrías insertar en una tabla llamada 'registros'
    // Por ahora, simulamos éxito para que tu botón funcione
    console.log("Datos recibidos:", req.body);
    res.json({ success: true, message: "Datos recibidos en el servidor" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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