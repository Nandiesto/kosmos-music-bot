require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const { DisTube } = require('distube')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
})

const distube = new DisTube(client, {
  leaveOnStop: false,
  leaveOnEmpty: false,
  emitNewSongOnly: true,
  plugins: [new SpotifyPlugin(), new SoundCloudPlugin(), new YtDlpPlugin()]
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageCreate', async message => {
  if (!message.content.startsWith('kosmos')) return
  const args = message.content.slice(6).trim().split(/ +/)
  const command = args.shift().toLowerCase()

  const vc = message.member.voice.channel
  if (!vc && ['play', 'skip', 'stop', 'pause', 'resume'].includes(command)) {
    return message.reply('Join a voice channel first.')
  }

  try {
    if (command === 'play') {
      distube.play(vc, args.join(' '), { textChannel: message.channel, member: message.member })
    } else if (command === 'skip') {
      distube.skip(message)
    } else if (command === 'stop') {
      distube.stop(message)
    } else if (command === 'pause') {
      distube.pause(message)
    } else if (command === 'resume') {
      distube.resume(message)
    } else if (command === 'queue') {
      const q = distube.getQueue(message)
      message.channel.send(
        'Queue:\n' +
        q.songs.map((s, i) => `${i + 1}. ${s.name} - \`${s.formattedDuration}\``).join('\n')
      )
    } else if (command === 'remove') {
      const pos = parseInt(args[0])
      const q = distube.getQueue(message)
      if (!isNaN(pos) && pos > 0 && pos < q.songs.length) {
        q.songs.splice(pos, 1)
        message.reply('Removed from queue.')
      }
    } else if (command === 'join') {
      await vc.join()
    } else if (command === 'leave') {
      vc.disconnect()
    } else if (command === 'nowplaying' || command === 'np') {
      const q = distube.getQueue(message)
      message.channel.send(`Now Playing: ${q.songs[0].name}`)
    } else if (command === 'help') {
      message.reply(`**Kosmos Bot Commands:**
- kosmos play <song name or URL> : Play or add a song
- kosmos pause : Pause playback
- kosmos resume : Resume playback
- kosmos skip : Skip current song
- kosmos stop : Stop playing and clear queue
- kosmos join : Bot joins your voice channel
- kosmos leave : Bot leaves voice channel
- kosmos queue : Show current queue
- kosmos remove <pos> : Remove song at position
- kosmos nowplaying (or np) : Show current playing song`)
    }
  } catch (e) {
    message.reply('Error: ' + e.message)
  }
})

client.login(process.env.BOT_TOKEN)
