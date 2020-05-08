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

  let sql;

 if (message.content.startsWith(PREFIX + 'island')) {
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

 if (message.content.startsWith(PREFIX + "prix")) {
    let args = message.content.split(' ');
    console.log(args);
    if(args[1] == null) {
        message.channel.send("Vous n'avez pas donné de prix !");
    } else {
      con.query(`SELECT * FROM player where discord_id = '${message.author.id}'`, (err, rows) => {
        if (err) throw err;

        if(rows.length < 1) {
          message.channel.send("Vous n'avez pas encore rentré votre nom d'ile, tapez >island [nom de votre ile]");
        } else {
          sql = `INSERT INTO bourse(day, value, player_id) VALUES (NOW(), ${args[1]}, ${rows[0].id})`;
          message.channel.send(`Vous avez défini le cours de navet à ${args[1]} pour votre île (${rows[0].island})`);
        }
        con.query(sql, console.log);

      })
    }

 }

   if (message.content === PREFIX + "bourse") {
     let today = new Date().toISOString().slice(0, 10)
     console.log(today)
     con.query(`SELECT * FROM bourse WHERE DATE(day) = '${today}'`, (err, rows) => {
       if(rows.length < 1) {
         message.channel.send("Aucun prix n'a été rentré aujourd'hui !");
       } else {
         con.query(`SELECT discord_id, island, value, day FROM player, bourse WHERE player_id=player.id ORDER BY value`, (err, rows) => {
           for (var i = 0; i < rows.length; i++) {
             const embed = new Discord.MessageEmbed()
             .setTitle(`${rows[i].island}`)
             .setDescription(`<@${rows[i].discord_id}>`)
             .addFields(
               { name: 'Prix :', value: `${rows[i].value}`},
               { name: 'Day :', value: `${rows[i].day}`},
             )
             message.channel.send(embed);
             // message.channel.send(`Ile : ${rows[i].island} Prix : ${rows[i].value}`)
             // console.log(rows[i]);
           }
         });
       }
     });
   }

   if(message.content === PREFIX + "higher") {
     let today = new Date().toISOString().slice(0, 10)
     console.log(today)
     con.query(`SELECT * FROM bourse WHERE DATE(day) = '${today}'`, (err, rows) => {
       if(rows.length < 1) {
         message.channel.send("Aucun prix n'a été rentré aujourd'hui !");
       } else {
         con.query(`SELECT discord_id, island, value, day FROM player, bourse WHERE player_id=player.id ORDER BY value DESC LIMIT 1`, (err, rows) => {
           for (var i = 0; i < rows.length; i++) {
             const embed = new Discord.MessageEmbed()
             .setTitle(`${rows[i].island}`)
             .setDescription(`<@${rows[i].discord_id}>`)
             .addFields(
               { name: 'Prix :', value: `${rows[i].value}`},
               { name: 'Day :', value: `${rows[i].day}`},
             )
             message.channel.send(embed);
             // message.channel.send(`Ile : ${rows[i].island} Prix : ${rows[i].value}`)
             // console.log(rows[i]);
           }
         });
       }
     });
   }
});

client.login(config.bot_token);
