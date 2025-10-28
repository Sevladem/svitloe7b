const TelegramAPI = require('node-telegram-bot-api')
const tcpp = require('tcp-ping')
const {token, pingList, flushUpdatesOnStart, shedule} = require('./options')
const {messages} = require('./messages')
const bot = new TelegramAPI(token, {polling: false})

let mychatid = -111
let svitloe = true
let svitloOFF = false
let active = true
let changeTime = new Date()


function getTime(dateFrom,dateTo){
    let milisecond = dateTo - dateFrom
    let seconds = Math.floor(milisecond / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    minutes = minutes - hours * 60

    let strHours = 'год.'
    let strMinutes = 'хв.'

    return `*${hours} ${strHours}, ${minutes} ${strMinutes}*`
}

function checkIpAndPortAddress (item, chatId) {
    let address = item.address
    let port = item.port || 80

    tcpp.probe(address, port, function (err, available) {

        if (available) {
            bot.sendMessage(chatId, messages.light_is_there(getTime(changeTime, new Date())), {'parse_mode':'Markdown'})
        }

        if (!available) {
            bot.sendMessage(chatId, messages.light_is_no_there(getTime(changeTime, new Date())), {'parse_mode':'Markdown'})
        }

    })

}

function probeIpAndPortAddress (item, callback) {
    let address = item.address
    let port = item.port || 80


        tcpp.probe(address, port, function (err, available) {

            callback(item, available)

        })

}

bot.setMyCommands([
    {command: "/light", description: "є світло чи нема? ось в чому питання."},
    // {command: "/shedule", description: "Приблизний графік відключень..."},
    {command: "/info", description: "Трохи про мене..."}

])

bot.on('message', async msg=>{
    const text = msg.text
    const chatId = msg.chat.id

    if (text === '/light' || text === '/light@Svitloebot' || text === '/light@testSvitloebot'){
        checkIpAndPortAddress(pingList[0], chatId)
    }
    if (text === '/info' || text === '/info@Svitloebot' || text === '/info@testSvitloebot') {
        bot.sendMessage(chatId, messages.info)
    }

    if (text === '/shedule' || text === '/shedule@Svitloebot' || text === '/shedule@testSvitloebot') {
        if (shedule) {
            await bot.sendPhoto(chatId, shedule)
        }
        bot.sendMessage(chatId, messages.shedule)
    }

    if (chatId == 187060567) {

        if (text === '/stop') {
            active = false
            bot.sendMessage(chatId, `active: ${active}`)
        }
        if (text === '/run') {
            active = true
            bot.sendMessage(chatId, `active: ${active}`)
        }

    }

})

bot.on('new_chat_members', msg =>{
    if (msg.from.id == 187060567 && (msg.new_chat_member.id == 5744811510 || msg.new_chat_member.id == 5987921444)){
        bot.sendMessage(msg.chat.id, messages.info)
        mychatid = msg.chat.id
    }
    console.log(msg)
})

function checkLightb7(countOfCheck) {


    if (mychatid != -111 && active) {
        let countTry = 0
        let available = false

        for (let ii = 0; ii < countOfCheck; ii++) {
            let pingListItem = pingList[ii]
            probeIpAndPortAddress(pingListItem, function (item, availableProbe) {
                countTry++
                available = available || availableProbe
                console.log(`ii:${ii}  `, item, `  available:${available}`, `  availableProbe:${availableProbe}`, `  svitloe:${svitloe}`, `  mychatid:${mychatid}`)

                if (countTry == countOfCheck) {
                    if (available && svitloe){
                        svitloOFF = false
                    }
                    if (!available && svitloe) {
                        if (svitloOFF || countOfCheck > 1){
                            bot.sendMessage(mychatid, messages.lightoff + '\nВоно було з нами ' + getTime(changeTime, new Date()),{parse_mode:'Markdown'})
                            svitloe = false
                            changeTime = new Date()
                        } else {
                            //коррекція короткострокових втрат сигналу від сенсору (буває сенсор пропадає на 2-3 секунди)
                            //приймаємо рішення, що світла все ж таки немає після двух опитуваннь сенсору (ітервал 15 сек)
                            //цей функціонал працює тільки коли є один сенсор.
                            //коли буде 2 чи більше сенсорів (countOfCheck > 1) - ця гілка ніколи не спрацьовує
                            svitloOFF = true
                        }
                    }
                    if (available && !svitloe) {
                        bot.sendMessage(mychatid, messages.lighton + '\nЙого не було з нами ' + getTime(changeTime, new Date()),{parse_mode:'Markdown'})
                        svitloe = true
                        changeTime = new Date()
                    }
                }

            })
        }

    } else {
        console.log(`svitloe:${svitloe}`, `  mychatid:${mychatid}`, `  active:${active}`);
    }
}


let intervalTime = 15000;//интервал проверки доступности WEB сервиса
setInterval(function () {
    checkLightb7(pingList.length)
}, intervalTime)

async function startBot() {
    if (flushUpdatesOnStart) {
        try {
            const updates = await bot.getUpdates();
            if (updates.length) {
                const lastUpdateId = updates[updates.length - 1].update_id;
                await bot.getUpdates({offset: lastUpdateId + 1});
            }
        } catch (error) {
            console.error('Не вдалося очистити чергу апдейтів перед стартом:', error);
        }
    }

    try {
        await bot.startPolling();
    } catch (error) {
        console.error('Не вдалося запустити long polling:', error);
    }
}

startBot();
