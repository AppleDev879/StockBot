const Discord = require('discord.js');
const https = require('https');
const server = require('./keep_alive');

const client = new Discord.Client({ intents: ['GUILD_WEBHOOKS'] });
const TD_API_KEY = process.env['TD_API_KEY']
const discord_token = process.env['BOT_TOKEN']

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'price') {
        const ticker = interaction.options.getString('ticker').toUpperCase();
        const options = {
            hostname: 'api.tdameritrade.com',
            port: 443,
            path: `/v1/marketdata/quotes?apikey=${TD_API_KEY}&symbol=${ticker}`,
            method: 'GET',
        }
        console.log(options.hostname+options.path);

        const req = https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
            if (res.statusCode == 200) {
                res.on('data', data => {
                    const json = JSON.parse(data);
                    if (isEmpty(json)) {
                        interaction.reply('Invalid ticker!')
                    } else {
                        console.log(json)
                        const price = round(json[ticker]['lastPrice'])
                        const percentChange = round(json[ticker]['regularMarketPercentChangeInDouble'])
                        var output = ""
                        if (percentChange > 0) {
                            output = `📈 ${ticker} is $${price}, up ${percentChange}%`
                        } else {
                            output = `📉 ${ticker} is $${price}, down ${percentChange}%`
                        }
                        interaction.reply(output)
                    }
                })
            } else {
                interaction.reply('Connection failed')
            }
        })

        req.on('error', error => {
            console.error(error)
        })
        req.end()
	}
});

// https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
function isEmpty(obj) {
    for(var prop in obj) {
      if(Object.prototype.hasOwnProperty.call(obj, prop)) {
        return false;
      }
    }
  
    return JSON.stringify(obj) === JSON.stringify({});
}

function round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100
}

client.login(discord_token);
server.keepAlive();