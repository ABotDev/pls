const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = class MuteCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'mute',
      usage: 'mute <user mention/ID> <time> [reason]',
      description: 'Mutes a user for the specified amount of time (max is 10 days).',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['mute @Nettles 10s', 'mute @Nettles 30m talks too much']
    });
  }
  async run(message, args) {

    const muteRoleId = message.client.db.settings.selectMuteRoleId.pluck().get(message.guild.id);
    let muteRole;
    if (muteRoleId) muteRole = message.guild.roles.cache.get(muteRoleId);
    else return this.sendErrorMessage(message, 'There is currently no `mute role` set on this server.');

    const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member) return this.sendErrorMessage(message, 'Invalid argument. Please mention a user or provide a user ID.');
    if (member === message.member) return this.sendErrorMessage(message, 'Invalid argument. You cannot mute yourself.');
    if (member === message.guild.me) return this.sendErrorMessage(message, 'Invalid argument. You cannot mute me.');
    if (member.roles.highest.position >= message.member.roles.highest.position)
      return this.sendErrorMessage(message, 'Invalid argument. You cannot mute someone with an equal or higher role.');
    if (!args[1])
      return this.sendErrorMessage(message, `
      Invalid argument. Please enter a length of time of 10 days or less (\`1s\`/\`m\`/\`h\`/\`d\`).
    `);
    let time = ms(args[1]);
    if (!time || time > 864000000) // Cap at 10 days, larger than 24.8 days causes integer overflow
      return this.sendErrorMessage(message, `
        Invalid argument. Please enter a length of time of 10 days or less (\`1s\`/\`m\`/\`h\`/\`d\`).
      `);
    let reason = args.slice(2).join(' ');
    if(!reason) reason = 'No reason provided';
    if (member.roles.cache.has(muteRoleId)) return this.sendErrorMessage(message, `${member} is already muted!`);

    // Mute member
    try {
      await member.roles.add(muteRole);
    } catch (err) {
      message.client.logger.error(err.stack);
      return this.sendErrorMessage(message, 'Something went wrong. Please check the role hierarchy.', err.message);
    }
    const muteEmbed = new MessageEmbed()
      .setTitle('Mute Member')
      .setDescription(`${member} has now been muted for **${ms(time, { long: true })}**.`)
      .addField('Executor', message.member, true)
      .addField('Member', member, true)
      .addField('Time', `\`${ms(time)}\``, true)
      .addField('Reason', reason)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(muteEmbed);
    member.timeout = message.client.setTimeout(async () => {
      try {
        await member.roles.remove(muteRole);
        const unmuteEmbed = new MessageEmbed()
          .setTitle('Unmute Member')
          .setDescription(`${member} has been unmuted.`)
          .setTimestamp()
          .setColor(message.guild.me.displayHexColor);
        message.channel.send(unmuteEmbed);
      } catch (err) {
        message.client.logger.error(err.stack);
        return this.sendErrorMessage(message, 'Something went wrong. Please check the role hierarchy.', err.message);
      }
    }, time);

    // Update modlog
    this.sendModlogMessage(message, reason, { Member: member, Time: `\`${ms(time)}\`` });
  }
};
