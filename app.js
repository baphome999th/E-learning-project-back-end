const express = require("express");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("./db");
const cors = require("cors");
const app = express();
const port = 3000;

const corsOptions = {
  origin: ["http://127.0.0.1:8080"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser());

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const authToken = authHeader && authHeader.split(' ')[1];

  if (!authToken) {
    console.error(error);
    res.status(401).json({ msg: 'No existe token' }); // Si el token no es válido, retorna un error 401
  }

  try {
    const decoded = jwt.verify(authToken, '*AeS12345_75/_'); // Verifica y decodifica el token
    req.email = decoded.email; // Guarda el usuario en la solicitud para usar en las rutas protegidas
    next(); // Continúa con el siguiente middleware o ruta
  } catch (error) {
    console.error(error);
    res.status(401).json({ msg: 'Token no válido' }); // Si el token no es válido, retorna un error 401
  }
}


// Validación y sanitización de los campos del formulario de registro
const validateRegistrationFields = [
  body("Name").trim().escape().notEmpty(),
  body("Email")
    .isEmail()
    .withMessage("Debe ingresar un correo electrónico válido"),
  body("Password").notEmpty().withMessage("La contraseña es requerida"),
  body("LastName")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("El apellido es requerido"),
  body("DateOfBirth")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("La fecha de nacimiento es requerida"),
  body("MunicipalityId")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("El municipio es requerido "),
  body("InstitutionId")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("La institucion es requerida "),
  body("UserTypeId")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("El tipo de usuario es requerido "),
];

app.post("/form", validateRegistrationFields, async (req, res) => {
  try {
    // Verificamos si hay errores en la validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(req.cookies);

    const {
      Name,
      LastName,
      DateOfBirth,
      Email,
      Password,
      MunicipalityId,
      InstitutionId,
      UserTypeId,
    } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "INSERT INTO user (Name, LastName, DateOfBirth, Email, Password,  MunicipalityId,InstitutionId,UserTypeId) VALUES (?, ?, ?, ?,?,?,?,?)",
      [
        Name,
        LastName,
        DateOfBirth,
        Email,
        hashedPassword,
        MunicipalityId,
        InstitutionId,
        UserTypeId,
      ]
    );

    res.json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ha ocurrido un error al registrar el usuario" });
  }
});

// Validación y sanitización de los campos del formulario de login
const validateLoginFields = [
  body("email")
    .isEmail()
    .withMessage("Debe ingresar un correo electrónico válido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
];

app.post("/login", validateLoginFields, async (req, res) => {
  try {
    // Verificamos si hay errores en la validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT cast(Password as char) password FROM user WHERE Email = ? ",
      [email]
    );

    const storedPassword = rows[0].password;

    const passwordMatch = await bcrypt.compare(password, storedPassword);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Correo electrónico o contraseña incorrectos" });
    }

    // si llegamos hasta aquí, la contraseña es correcta y el usuario está autenticado
    // realiza las acciones necesarias para permitir que el usuario inicie sesión en tu aplicación

    // El usuario ha ingresado la contraseña correcta

    const secretKey = "*AeS12345_75/_";

    //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
    //res.set('Access-Control-Allow-Credentials', 'true');

    // Generación del token de autenticación
    const generateAuthToken = (email) => {
      const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
      return token;
    };

    // Uso del método para generar el token
    const token = generateAuthToken(email);

    res.cookie("authToken", token, {
      maxAge: 3600000,
      httpOnly: true, // Para que la cookie no sea accesible desde JavaScript en el cliente
      secure: true,
      sameSite: "None",
      port: "",
      domain: "localhost",
    });

    res.send({
      message: "Inicio de sesión exitoso",
      token: token // enviar el token en el cuerpo de la respuesta,
    });

    console.log(token);

    // Si el usuario existe y la contraseña es correcta, enviamos una respuesta exitosa
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ha ocurrido un error al iniciar sesión" });
  }
});

app.get("/options/user_types", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute("SELECT * FROM usertype");
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/options/municipality", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute("SELECT * FROM municipality");

    console.log(rows);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/options/institution", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute("SELECT * FROM institution;");

    

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


app.get("/getUser", authMiddleware,async (req, res) => {
  try{
    const connection = await pool.getConnection();

    const[rows] = await connection.execute(
      
      "select * from user where Email = ?",
      [req.email]
    
    );

    res.json(rows);

  }catch(err){
  console.error("Error getting user");  
  res.status(401).send("usuario no autorizado");
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
