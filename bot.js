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
  client.user.setActivity(`${PREFIX}help`)
});

client.on('message', message => {

  if (message.content === PREFIX + "help") {
    const embed = new Discord.MessageEmbed()
    .setTitle(`**HELP**`)
    .setColor(0x4fba6f)
    .addFields(
      { name: `${PREFIX}help`, value: `Affiche la liste des commandes.`},
      { name: `${PREFIX}island`, value: `Affiche le nom de votre ile si vous l'avez déjà rentré.`},
      { name: `${PREFIX}island [name]`, value: `Defini le nom de vôtre île.`},
      { name: `${PREFIX}prix [value]`, value: `Défini le prix du cours du navet pour vôtre pour la demi-journée correcpondante`},
      { name: `${PREFIX}bourse`, value: `Affiche les prix de toutes les îles selon la demi-journée`},
      { name: `${PREFIX}higher`, value: `Affiche le prix le plus haut de la journée correcpondante`},
    )
    message.channel.send(embed);
  }

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
     let date = new Date();
     console.log(today)
     let time = date.getHours();
     console.log(time);
     con.query(`SELECT * FROM bourse WHERE DATE(day) = '${today}'`, (err, rows) => {
       if(rows.length < 1) {
         message.channel.send("Aucun prix n'a été rentré aujourd'hui !");
       } else {
       if(time >= 8 && time < 12) { //c'est le matin
         message.channel.send("Voici la bourse pour le matin :");
         con.query(`SELECT * FROM player, bourse WHERE TIMEDIFF(TIME(day), "08:00:00") < "04:00:00" AND player_id=player.id ORDER BY value`, (err, rows) => {
                for (var i = 0; i < rows.length; i++) {
                      const embed = new Discord.MessageEmbed()
                      .setTitle(`${rows[i].island}`)
                      .setDescription(`<@${rows[i].discord_id}>`)
                      .setColor(0x4fba6f)
                      .addFields(
                        { name: 'Prix :', value: `${rows[i].value}`},
                        { name: 'Day :', value: `${rows[i].day}`},
                      )
                      message.channel.send(embed);
                }
         })
       } else if (time >= 12 && time <= 21) {
         message.channel.send("Voici la bourse pour l'après-midi :");

         con.query(`SELECT * FROM player, bourse WHERE TIMEDIFF(TIME(day), "08:00:00") > "04:00:00" AND player_id=player.id ORDER BY value`, (err, rows) => {
                for (var i = 0; i < rows.length; i++) {
                      const embed = new Discord.MessageEmbed()
                      .setTitle(`${rows[i].island}`)
                      .setDescription(`<@${rows[i].discord_id}>`)
                      .setColor(0x4fba6f)
                      .addFields(
                        { name: 'Prix :', value: `${rows[i].value}`},
                        { name: 'Day :', value: `${rows[i].day}`},
                      )
                      message.channel.send(embed);
                }
         })
       } else {
          message.channel.send("La boutique Nook est fermée mais voici la bourse du jour");
          con.query(`SELECT discord_id, island, value, day FROM player, bourse WHERE player_id=player.id ORDER BY value`, (err, rows) => {
            for (var i = 0; i < rows.length; i++) {
              const embed = new Discord.MessageEmbed()
              .setTitle(`${rows[i].island}`)
              .setDescription(`<@${rows[i].discord_id}>`)
              .setColor(0x4fba6f)
              .addFields(
                { name: 'Prix :', value: `${rows[i].value}`},
                { name: 'Day :', value: `${rows[i].day}`},
              )
              message.channel.send(embed);
              }
          });
        }
      }
    });
  }

   if(message.content === PREFIX + "higher") {
     let today = new Date().toISOString().slice(0, 10)
     let date = new Date();
     console.log(today)
     let time = date.getHours();
     console.log(time);
     con.query(`SELECT * FROM bourse WHERE DATE(day) = '${today}'`, (err, rows) => {
       if(rows.length < 1) {
         message.channel.send("Aucun prix n'a été rentré aujourd'hui !");
       } else {
       if(time >= 8 && time < 12) { //c'est le matin
         message.channel.send("Voici le prix le plus haut pour le matin :");
         con.query(`SELECT * FROM player, bourse WHERE TIMEDIFF(TIME(day), "08:00:00") < "04:00:00" AND player_id=player.id ORDER BY value DESC LIMIT 1`, (err, rows) => {
                for (var i = 0; i < rows.length; i++) {
                      const embed = new Discord.MessageEmbed()
                      .setTitle(`${rows[i].island}`)
                      .setDescription(`<@${rows[i].discord_id}>`)
                      .setColor(0x4fba6f)
                      .addFields(
                        { name: 'Prix :', value: `${rows[i].value}`},
                        { name: 'Day :', value: `${rows[i].day}`},
                      )
                      message.channel.send(embed);
                }
         })
       } else if (time >= 12 && time <= 21) {
         message.channel.send("Voici le prix le plus haut pour l'après-midi :");

         con.query(`SELECT * FROM player, bourse WHERE TIMEDIFF(TIME(day), "08:00:00") > "04:00:00" AND player_id=player.id ORDER BY value DESC LIMIT 1`, (err, rows) => {
                for (var i = 0; i < rows.length; i++) {
                      const embed = new Discord.MessageEmbed()
                      .setTitle(`${rows[i].island}`)
                      .setDescription(`<@${rows[i].discord_id}>`)
                      .setColor(0x4fba6f)
                      .addFields(
                        { name: 'Prix :', value: `${rows[i].value}`},
                        { name: 'Day :', value: `${rows[i].day}`},
                      )
                      message.channel.send(embed);
                }
         })
       } else {
          message.channel.send("La boutique Nook est fermée mais voici le prix le plus haut du jour");
          con.query(`SELECT discord_id, island, value, day FROM player, bourse WHERE player_id=player.id ORDER BY value DESC LIMIT 1`, (err, rows) => {
            for (var i = 0; i < rows.length; i++) {
              const embed = new Discord.MessageEmbed()
              .setTitle(`${rows[i].island}`)
              .setDescription(`<@${rows[i].discord_id}>`)
              .setColor(0x4fba6f)
              .addFields(
                { name: 'Prix :', value: `${rows[i].value}`},
                { name: 'Day :', value: `${rows[i].day}`},
              )
              message.channel.send(embed);
              }
          });
        }
      }
    });
   }

 });



client.login(config.bot_token);
