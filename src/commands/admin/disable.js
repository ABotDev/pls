const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');

module.exports = class DisableCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'disable',
      aliases: ['dis'],
      usage: 'disable <command | command type>',
      description: oneLine`
        Disables the provided command or command type. 
        Disabled commands will no longer be able to be used, and will no longer show up with the \`help\` command.
        \`${client.types.ADMIN}\` commands cannot be disabled.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['disable ping', 'disable Fun']
    });
  }
  run(message, args) {

    if (args.length === 0 || args[0].toLowerCase() === message.client.types.OWNER.toLowerCase()) 
      return this.sendErrorMessage(message, 'Invalid argument. Please provide a valid command or command type.');
    if (args[0].toLowerCase() === message.client.types.ADMIN.toLowerCase()) 
      return this.sendErrorMessage(message, `
        Invalid argument. \`${message.client.types.ADMIN}\` commands cannot be disabled.
      `);

    let disabledCommands = message.client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
    if (typeof(disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');
    const type = args[0].toLowerCase();
    const command = message.client.commands.get(args[0]) || message.client.aliases.get(args[0]);
    let description;

    // Handle types
    const typeListOrig = Object.values(message.client.types);
    const typeList = typeListOrig.map(t => t.toLowerCase());
    if (typeList.includes(type)) {
      for (const cmd of message.client.commands.values()) {
        if (cmd.type.toLowerCase() === type  && !disabledCommands.includes(cmd.name)) disabledCommands.push(cmd.name);
      }
      description = `All \`${typeListOrig[typeList.indexOf(type)]}\` type commands have been successfully **disabled**.`;

    // Handle single commands
    } else if (command && command.type != message.client.types.OWNER) {
      if (command.type === message.client.types.ADMIN) 
        return this.sendErrorMessage(message, `
          Invalid argument. \`${message.client.types.ADMIN}\` commands cannot be disabled.
        `);
      if (!disabledCommands.includes(command.name)) disabledCommands.push(command.name); // Add to array if not present
      description = `The \`${command.name}\` command has been successfully **disabled**.`;
    } else return this.sendErrorMessage(message, 'Invalid argument. Please provide a valid command or command type.');

    message.client.db.settings.updateDisabledCommands.run(disabledCommands.join(' '), message.guild.id);

    disabledCommands = disabledCommands.map(c => `\`${c}\``).join(' ') || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Server Settings')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(description)
      .addField('Setting', 'Disabled Commands', true)
      .addField('Current Value', disabledCommands, true)
      .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send(embed);
  }
};
