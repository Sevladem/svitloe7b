const TelegramAPI = require('node-telegram-bot-api')
const tcpp = require('tcp-ping')
const {token, pingList} = require('./options')
const bot = new TelegramAPI(token, {polling: true})

let mychatid = -111
let svitloe = true

function checkIpAndPortAddress (item, chatId) {
    let address = item.address
    let port = item.port || 80

    tcpp.probe(address, port, function (err, available) {

        console.log(item, available, svitloe)

        if (available) {
            bot.sendMessage(chatId, "Зараз світло в будинку є")
        }

        if (!available) {
            bot.sendMessage(chatId, 'Зараз світла в будинку немає')
        }

    })

}

function probeIpAndPortAddress (item, chatId) {
    let address = item.address
    let port = item.port || 80

    if (chatId != -111) {
        tcpp.probe(address, port, function (err, available) {

            console.log(item, available, svitloe, chatId);

            if (!available && svitloe) {
                bot.sendMessage(chatId, 'Світло пропало')
                svitloe = false
            }
            if (available && !svitloe) {
                bot.sendMessage(chatId, "Світло з'явилось")
                svitloe = true
            }

        })
    } else {
        console.log(item, svitloe, chatId);
    }
}

bot.setMyCommands([
    {command: "/light", description: "є світло чи нема? ось в чому питання."}
])

bot.on('message', async msg=>{
    const text = msg.text
    const chatId = msg.chat.id

    if (text === '/light' || text === '/light@Svitloebot'){
        checkIpAndPortAddress(pingList[0], chatId)
    }
    if (text === '/switch') {
        // bot.sendMessage(msg.chat.id, "Всім привіт.\n" +
        //     "Я бот, який буде допомогати перевіряти є світло в будинку, чи немає.\n" +
        //     "Коли світло зникне, чи з'явиться - я повідомлю.\n\n" +
        //     "Щоб узнати 'Є світло чи немає' в будь-який момент - достатньо набрати команду /light@Svitloebot\n" +
        //     "або перейти до мене в особисті і набрати команду /light")
    }
})

bot.on('new_chat_members', msg =>{
    if (msg.from.id == 187060567 && msg.new_chat_member.id == 5744811510){
        bot.sendMessage(msg.chat.id, "Всім привіт.\n" +
            "Я бот, який буде допомогати перевіряти є світло в будинку, чи немає.\n" +
            "Коли світло зникне, чи з'явиться - я повідомлю.\n\n" +
            "Щоб узнати 'Є світло чи немає' в будь-який момент - достатньо набрати команду /light\n" +
            "тут, або в особистих")
        mychatid = msg.chat.id
    }
    console.log(msg)
})

let intervalTime = 15000;//интервал проверки доступности WEB сервиса
setInterval(function () {
    probeIpAndPortAddress(pingList[0], mychatid)
}, intervalTime)