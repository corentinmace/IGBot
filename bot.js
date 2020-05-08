const Discord = require('discord.js');
const mysql = require('mysql');
const config = require('./config.json');

const client = new Discord.Client();
const PREFIX = ">"

var con = mysql.createConnection({
  host: config.db_host,
  user: config.db_user,
  password: config.db_password,
  database: config.db_name
});

con.connect(err => {
  if(err) throw err;
  console.log("Connected to database");
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {

 if (message.content.startsWith(PREFIX + 'island')) {
   let sql;
   let args = message.content.split(' ');
   if(args[1] == null) {
      con.query(`SELECT island FROM player WHERE discord_id = '${message.author.id}'`, (err, rows) => {
       if(err) throw err;

       if(rows.length < 1) {
         message.channel.send("Vous devez spécifier le nom de vôtre île !")
       } else {
         message.channel.send(`Votre île s'appelle ${rows[0].island}`);
       }
     });
   } else {
     con.query(`SELECT * FROM player WHERE discord_id = '${message.author.id}'`, (err, rows) => {
       if(err) throw err;

       if(rows.length < 1) {
         sql = `INSERT INTO player (discord_id, island) VALUES ('${message.author.id}', '${args[1]}')`;
         message.channel.send(`Votre île s'appelle ${args[1]}`);
       } else {
         message.channel.send('Vous avez déjà rentré le nom de vôtre île !')
       }
       con.query(sql, console.log);
     });
   }
 }
});

client.login(config.bot_token);
