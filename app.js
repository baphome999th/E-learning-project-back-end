const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const cors = require('cors');
const app = express();
const port = 3000;


app.use(cors({ origin: 'http://127.0.0.1:8080' }));
app.use(bodyParser.json());

app.post('/form', async (req, res) => {
  try {
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

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
