const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

// Initialiser l'application Express et le serveur HTTP
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurer EJS pour le rendu des vues
app.set('view engine', 'ejs');
app.set('views', './views');

// Utiliser SQLite pour la base de données
const db = new sqlite3.Database('./db.sqlite3', (err) => {
  if (err) {
    console.error("Impossible d'ouvrir la base de données SQLite", err);
  } else {
    console.log('Base de données SQLite connectée');
  }
});

// Créer la table "messages" si elle n'existe pas
db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, message TEXT, datetime TEXT)', (err) => {
  if (err) {
    console.error('Erreur lors de la création de la table messages', err);
  }
});

// Middleware pour les fichiers statiques (CSS, JS)
app.use(express.static('public'));

// Page d'accueil avec formulaire de connexion
app.get('/', (req, res) => {
  res.render('index');
});

// Page de chat
app.get('/chat', (req, res) => {
  // Récupérer tous les messages de la base de données
  db.all('SELECT * FROM messages ORDER BY datetime DESC', [], (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des messages', err);
      res.status(500).send('Erreur serveur');
      return;
    }
    res.render('chat', { messages: rows });
  });
});

// Connexion WebSocket avec Socket.IO
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté.');

  // Écouter les messages envoyés par les clients
  socket.on('chatMessage', (msg, username) => {
    const datetime = new Date().toLocaleString('fr-FR');
    
    // Enregistrer le message dans la base de données SQLite
    db.run('INSERT INTO messages (username, message, datetime) VALUES (?, ?, ?)', [username, msg, datetime], function(err) {
      if (err) {
        console.error('Erreur lors de l\'insertion du message', err);
        return;
      }
      // Diffuser le message à tous les clients connectés
      io.emit('chatMessage', { username, message: msg, datetime });
    });
  });

  // Déconnexion de l'utilisateur
  socket.on('disconnect', () => {
    console.log('Un utilisateur a quitté.');
  });
});

// Exporter la fonction serverless pour Vercel
module.exports = (req, res) => {
  server.emit('request', req, res);
};
