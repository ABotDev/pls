const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const pkg = require(__basedir + '/package.json');
const moment = require('moment');
const { oneLine } = require('common-tags');

module.exports = class BotInfoCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'botinfo',
      aliases: ['bot', 'bi'],
      usage: 'botinfo',
      description: 'Fetches Matrix\'s information and statistics.',
      type: client.types.INFO
    });
  }
  run(message) {
    const owner = message.client.users.cache.get(message.client.ownerId);
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    const embed = new MessageEmbed()
      .setTitle('Matrix\'s Information')
      .setDescription(oneLine`
        Matrix is a feature-rich Discord bot built with customizability in mind.
        She comes packaged with a variety of commands and a 
        multitude of settings that can be tailored to your specific needs.
      `)
      .addField('ID', `\`${message.client.user.id}\``, true)
      .addField('Username', message.client.user.username, true)
      .addField('Discriminator', `\`#${message.client.user.discriminator}\``, true)
      .addField('Prefix', `\`${prefix}\``, true)
      .addField('Detected Users', message.client.users.cache.size - 1, true)
      .addField('Servers', message.client.guilds.cache.size, true)
      .addField('Current Version', `\`${pkg.version}\``, true)
      .addField('Library/Environment', 'Discord.js 12.2.0\nNode.js 12.16.3', true)
      .addField('Database', 'SQLite', true)
      .addField('Uptime', `${moment.duration(message.client.uptime).hours()} hours`, true)
      .addField('Owner', owner, true)
      .addField(
        'Links', 
        '[Invite Me](https://discord.com/api/oauth2/authorize?client_id=724597795410935839&permissions=268528727&scope=bot) | ' +
        '[Support Server](https://discord.gg/59sUb24) | '
      )
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};
