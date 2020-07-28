const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');

module.exports = class UnmuteCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'unmute',
      usage: 'unmute <user mention/ID>',
      description: 'Unmutes the specified user.',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['unmute @Nettles']
    });
  }
  async run(message, args) {
    const muteRoleId = message.client.db.settings.selectMuteRoleId.pluck().get(message.guild.id);
    let muteRole;
    if (muteRoleId) muteRole = message.guild.roles.cache.get(muteRoleId);
    else return this.sendErrorMessage(message, 'There is currently no `mute role` set on this server.');

    const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member) return this.sendErrorMessage(message, 'Invalid argument. Please mention a user or provide a user ID.');
    if (member.roles.highest.position >= message.member.roles.highest.position)
      return this.sendErrorMessage(message, 'Invalid argument. You cannot unmute someone with an equal or higher role.');
    let reason = args.slice(2).join(' ');
    if(!reason) reason = 'No reason provided';
    if (!member.roles.cache.has(muteRoleId)) return this.sendErrorMessage(message, `${member} is not muted.`);
    
    // Unmute member
    message.client.clearTimeout(member.timeout);
    try {
      await member.roles.remove(muteRole);
      const embed = new MessageEmbed()
        .setTitle('Unmute Member')
        .setDescription(`${member} has been unmuted.`)
        .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setColor(message.guild.me.displayHexColor);
      message.channel.send(embed);
    } catch (err) {
      message.client.logger.error(err.stack);
      return this.sendErrorMessage(message, 'Something went wrong. Please check the role hierarchy.', err.message);
    }
    
    // Update modlog
    this.sendModlogMessage(message, reason, { Member: member });
  }
};
