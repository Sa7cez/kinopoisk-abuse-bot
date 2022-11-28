const axios = require('axios')
const delay = require('delay')
const fs = require('fs/promises')
const randomInt = (value) => Math.floor(Math.random() * value)

let answers = {}
    cookies = {}

const TIMEOUT = 0

const instance = axios.create({
  baseURL: 'https://kp-guess-game-api.kinopoisk.ru/v1',
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'ru-RU,ru;q=0.5',
    'content-type': 'application/json',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    "referer": 'https://www.kinopoisk.ru/',
    'referrer-policy': 'strict-origin-when-cross-origin'
  }
})

const kinopoisk = async (account, cookie, gameId) => {
  const targets = {
    1: 75 + randomInt(100),
    2: 100 + randomInt(50),
    3: 75 + randomInt(100),
    4: 50 + randomInt(50),
    5: 50 + randomInt(50),
    6: 50 + randomInt(50),
    7: 50 + randomInt(50),
    8: 50 + randomInt(50),
    9: 50 + randomInt(50),
    10: 50 + randomInt(50),
    11: 50 + randomInt(50),
    12: 50 + randomInt(50),
    13: 50 + randomInt(50),
    14: 50 + randomInt(50),
    15: 100 + randomInt(50),
  }
  const headers = { headers : { cookie: cookie } }
  const game = (await instance.post('games', { gameId: gameId }, headers)).data
  let id = game.stateData.question.id
      prediction = answers[gameId][id] || game.stateData.question.answers[randomInt(4)]
      play = true
      points = 0

  while (play) {
    await delay(randomInt(TIMEOUT))
    await instance
      .post('questions/answers', { answer: prediction }, headers)
      .then(async (r) => {
        const answer = r.data
        if (answer.correctAnswer.length > 0) answers[gameId][parseInt(id)] = answer.correctAnswer
        points = answer.stateData.points
        console.log(`${gameId} | ${account} | очков:`, points, answer.correctAnswer)
        
        if (!answer.stateData.question)
          play = false
        else {
          id = answer.stateData.question.id
          prediction = answers[gameId][id] || answer.stateData.question.answers[randomInt(4)]
        }

        if (!r.data.isCorrect)
          await fs.writeFile('answers.json', JSON.stringify(answers))
      })
      .catch(e => console.log(e))
  }
  if (points === answers[gameId].length || points >= targets[gameId])
    return true
  return kinopoisk(account, cookie, gameId)
}

const main = async () => {
  try {
    cookies = (await fs.readFile('cookies.txt', 'utf8')).split('\n')
  } catch {
    console.log('Создайте файл cookies.txt, где в каждой строчке ваши куки для Кинопоиска.')
  }
  const episodes = (await instance.get('https://kp-guess-game-api.kinopoisk.ru/v1/episodes')).data.episodes.filter(episode => new Date(episode.startsAt) < new Date())
  const games = episodes.reduce((acc, episode) => acc + episode.games.length, 0)
  answers = JSON.parse(await fs.readFile('answers.json', 'utf8'))
  for (let i = 1; i <= games; i++) {
    if (!answers[i]) answers[i] = {}
    console.log(`В базе ${Object.keys(answers[i]).length} ответов на ${i} квиз!`)
    await Promise.all(cookies.map((cookie, j) => kinopoisk(j, cookie, i).catch(e => { console.log(e) })))
  }
}

main()