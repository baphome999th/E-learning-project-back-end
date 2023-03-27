const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');
const app = express();
const port = 3000;


app.use(cors({ origin: 'http://127.0.0.1:8080' }));
app.use(bodyParser.json());

// Validación y sanitización de los campos del formulario de registro
const validateRegistrationFields = [
  body('username').trim().escape().notEmpty().withMessage('El nombre de usuario es requerido'),
  body('email').isEmail().withMessage('Debe ingresar un correo electrónico válido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  body('phonenumber').trim().escape().notEmpty().withMessage('El número de teléfono es requerido')
];

app.post('/form', validateRegistrationFields, async (req, res) => {
  try {
    // Verificamos si hay errores en la validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, phonenumber } = req.body;
    
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'INSERT INTO estudiante (username, email, password, phonenumber) VALUES (?, ?, ?, ?)',
      [username, email, password, phonenumber]
    );
    
    res.json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ha ocurrido un error al registrar el usuario' });
  }
});

// Validación y sanitización de los campos del formulario de login
const validateLoginFields = [
  body('email').isEmail().withMessage('Debe ingresar un correo electrónico válido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

app.post('/login', validateLoginFields, async (req, res) => {
  try {
    // Verificamos si hay errores en la validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM estudiante WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }

    // Si el usuario existe y la contraseña es correcta, enviamos una respuesta exitosa
    res.json({ message: 'Inicio de sesión exitoso' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ha ocurrido un error al iniciar sesión' });
  }
});



app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
