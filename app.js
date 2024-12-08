
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 3000;

// Créer ou ouvrir la base de données SQLite
const db = new sqlite3.Database('./database/database.db');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Création de la table pour les connexions
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS connections (id INTEGER PRIMARY KEY, name TEXT, promo TEXT, connected_at TEXT)');
});

// Route pour afficher la page d'accueil
app.get('/', (req, res) => {
  res.render('index');
});

// Route pour afficher la page du chat
app.get('/chat', (req, res) => {
  // Récupérer toutes les connexions depuis la base de données
  db.all('SELECT * FROM connections ORDER BY connected_at DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.render('chat', {
      connections: rows,
      moment: moment
    });
  });
});

// Route pour enregistrer une connexion
app.post('/join', (req, res) => {
  const { name, promo } = req.body;
  const connectedAt = moment().format('YYYY-MM-DD HH:mm:ss'); // Format de la date et heure

  // Insérer la connexion dans la base de données
  db.run('INSERT INTO connections (name, promo, connected_at) VALUES (?, ?, ?)', [name, promo, connectedAt], function(err) {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('/chat');
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
