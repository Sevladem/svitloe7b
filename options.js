const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env')

if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    envLines.forEach(line => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) {
            return
        }
        const separatorIndex = trimmed.indexOf('=')
        if (separatorIndex === -1) {
            return
        }
        const key = trimmed.slice(0, separatorIndex).trim()
        if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
            return
        }
        const value = trimmed.slice(separatorIndex + 1).trim()
        process.env[key] = value
    })
}

const requireEnv = (name) => {
    const value = process.env[name]
    if (!value) {
        throw new Error(`${name} environment variable is required`)
    }
    return value
}

const token = requireEnv('TELEGRAM_BOT_TOKEN')

const pingListRaw = requireEnv('PING_LIST')

let pingList
try {
    pingList = JSON.parse(pingListRaw)
} catch (error) {
    throw new Error('PING_LIST must contain valid JSON (e.g. a JSON array of sensor objects)')
}

if (!Array.isArray(pingList) || pingList.length === 0) {
    throw new Error('PING_LIST must be a non-empty JSON array')
}

const sheduleEnv = process.env.SCHEDULE_IMAGE_PATH
let shedule

if (sheduleEnv) {
    const resolvedShedulePath = path.isAbsolute(sheduleEnv)
        ? sheduleEnv
        : path.resolve(__dirname, sheduleEnv)

    if (!fs.existsSync(resolvedShedulePath)) {
        throw new Error(`SCHEDULE_IMAGE_PATH does not point to an existing file: ${resolvedShedulePath}`)
    }

    shedule = resolvedShedulePath
} else {
    const defaultShedulePath = path.join(__dirname, 'img', 'shedule.png')
    shedule = fs.existsSync(defaultShedulePath) ? defaultShedulePath : undefined
}

const flushUpdatesOnStartEnv = process.env.FLUSH_UPDATES_ON_START
const flushUpdatesOnStart = flushUpdatesOnStartEnv ? flushUpdatesOnStartEnv !== 'false' : true

module.exports = {
    token,
    pingList,
    shedule,
    flushUpdatesOnStart
}
