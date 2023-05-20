import dayjs from 'dayjs'
import { selfDayjs, timeZone } from './src/utils/set-def-dayjs.js'
import { getAccessToken, getWeather3,getCIBA,
    getOneTalk, getBirthdayMessage, sendMessageReply,
    callbackReply, 
    getDateDiffList,
    getSlotList} from './src/services/index.js'
import { config } from './config/index.js'
import { toLowerLine, getColor } from './src/utils/index.js'

const main = async () => {
    // 获取accessToken
    const accessToken = await getAccessToken()
    // 接收的用户
    const users = config.USERS
    // 省份和市
    const province = config.PROVINCE
    const city = config.CITY
    // 获取每日天气
    const {
        // 天气
        weather,
        // 最高温度
        temp: maxTemperature, 
        // 最低温度
        tempn: minTemperature,
        // 风向
        wd: windDirection,
        // 风力等级
        ws: windScale
    } = await getWeather3(province, city)
    // 获取金山词霸每日一句
    const { content: noteEn, note: noteCh} = await getCIBA()
    // 获取每日一言
    const { hitokoto: oneTalk, from: talkFrom} = await getOneTalk(config.LITERARY_PREFERENCE)
    // 统计日列表计算日期差
    const dateDiffParams = getDateDiffList().map(item => {
        return { name: item.keyword, value: item.diffDay, color: getColor() }
    })

    // 获取插槽中的数据
    const slotParams = getSlotList().map(item => {
        return { name: item.keyword, value: item.checkout, color: getColor() }
    })

    // 获取生日信息
    const birthdayMessage = getBirthdayMessage()
    const birthdayMessagelist = birthdayMessage.split("\n")
    const birthdayMessage0 = birthdayMessagelist[0]
    const birthdayMessage1 = birthdayMessagelist[1]
    const birthdayMessage2 = birthdayMessagelist[2]
    const birthdayMessage3 = birthdayMessagelist[3]

    // 集成所需信息
    const week_list = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
    const wxTemplateParams = [
        { name: toLowerLine('date'), value: `${selfDayjs().format('YYYY-MM-DD')} ${week_list[selfDayjs().format('d')]}`},
        { name: toLowerLine('province'), value: province},
        { name: toLowerLine('city'), value: city},
        { name: toLowerLine('weather'), value: weather},
        { name: toLowerLine('minTemperature'), value: minTemperature},
        { name: toLowerLine('maxTemperature'), value: maxTemperature},
        { name: toLowerLine('windDirection'), value: windDirection},
        { name: toLowerLine('windScale'), value: windScale},
        { name: toLowerLine('birthdayMessage0'), value: birthdayMessage0},
        { name: toLowerLine('birthdayMessage1'), value: birthdayMessage1},
        { name: toLowerLine('birthdayMessage2'), value: birthdayMessage2},
        { name: toLowerLine('birthdayMessage3'), value: birthdayMessage3},
        // { name: toLowerLine('noteEn'), value: noteEn},
        // { name: toLowerLine('noteCh'), value: noteCh},
        { name: toLowerLine('oneTalk'), value: oneTalk},
        { name: toLowerLine('talkFrom'), value: talkFrom},
    ].concat(dateDiffParams.concat(slotParams))

    // 公众号推送消息
    const sendMessageTemplateId = config.TEMPLATE_ID
    const {
        needPostNum,
        successPostNum,
        failPostNum,
        successPostIds,
        failPostIds
    } = await sendMessageReply(sendMessageTemplateId, users, accessToken, wxTemplateParams)

    // 推送结果回执
    const postTimeZone = timeZone()
    const postTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const callbackTemplateParams = [
        { name: toLowerLine('postTimeZone'), value: postTimeZone},
        { name: toLowerLine('postTime'), value: postTime},
        { name: toLowerLine('needPostNum'), value: needPostNum},
        { name: toLowerLine('successPostNum'), value: successPostNum},
        { name: toLowerLine('failPostNum'), value: failPostNum},
        { name: toLowerLine('successPostIds'), value: successPostIds},
        { name: toLowerLine('failPostIds'), value: failPostIds},
    ].concat(wxTemplateParams)

    const callbackTemplateId = config.CALLBACK_TEMPLATE_ID
    if (callbackTemplateId) {
        await callbackReply(callbackTemplateId, config.CALLBACK_USERS, accessToken, callbackTemplateParams)
    }


}

main()
