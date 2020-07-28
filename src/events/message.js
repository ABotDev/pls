const { MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');



module.exports = (client, message) => {
  if (message.channel.type === 'dm' || message.author.bot) return;

  // Get disabled commands
  let disabledCommands = client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
  if (typeof(disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');
  
  // Check if points are disabled
  const pointsDisabled = client.utils.checkPointsDisabled(client, message.guild, disabledCommands);

  // Command handler
  const prefix = client.db.settings.selectPrefix.pluck().get(message.guild.id);
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*`);
  if (!prefixRegex.test(message.content)) {

    // Update points with messagePoints value
    if (!pointsDisabled) {
      const messagePoints = client.db.settings.selectMessagePoints.pluck().get(message.guild.id);
      client.db.users.updatePoints.run({ points: messagePoints }, message.author.id, message.guild.id);
    }
    return;
  } 

  const [, match] = message.content.match(prefixRegex);
  const args = message.content.slice(match.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();
  let command = client.commands.get(cmd) || client.aliases.get(cmd); // If command not found, check aliases
  if (command && !disabledCommands.includes(command.name)) {

    // Check permissions
    const permission = command.checkPermissions(message);
    if (permission) {

      // Update points with commandPoints value
      if (!pointsDisabled) {
        const commandPoints = client.db.settings.selectCommandPoints.pluck().get(message.guild.id);
        client.db.users.updatePoints.run({ points: commandPoints }, message.author.id, message.guild.id);
      }
      return command.run(message, args); // Run command
    }
  } else if (args.length == 0 && !message.content.startsWith(prefix)) {
    const embed = new MessageEmbed()
      .setTitle('Matriz\'s Prefix')
      .addField('Prefix', `\`${prefix}\``, true)
      .addField('Example', `\`${prefix}ping\``, true)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};

