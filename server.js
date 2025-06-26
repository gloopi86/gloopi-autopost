require('dotenv').config();

const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const Twit = require('twit');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();

app.get('/', (req, res) => res.send('Gloopi bot is alive.'));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running...');
});

// 初始化 OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// 初始化 Twitter
const twitterClient = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
});

// 取得隨機語錄
async function getQuote() {
  const prompt = `請用「迷因 + 哲學 + 宇宙觀」的風格，寫一句 Gloopi 的每日語錄，20 字以內`;
  const res = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
  });
  return res.data.choices[0].message.content.trim().replace(/^"|"$/g, '');
}

// 隨機選圖
function getRandomImage() {
  const imagesFolder = path.join(__dirname, 'images');
  const imageFiles = fs.readdirSync(imagesFolder);
  const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
  return path.join(imagesFolder, randomImage);
}

// 發佈貼文
async function postTweet() {
  try {
    const quote = await getQuote();
    const imagePath = getRandomImage();
    const b64content = fs.readFileSync(imagePath, { encoding: 'base64' });

    twitterClient.post('media/upload', { media_data: b64content }, (err, data) => {
      if (err) throw err;
      const mediaIdStr = data.media_id_string;
      const meta_params = { media_id: mediaIdStr };

      twitterClient.post('media/metadata/create', meta_params, (err) => {
        if (err) throw err;

        const params = { status: quote, media_ids: [mediaIdStr] };
        twitterClient.post('statuses/update', params, (err) => {
          if (err) throw err;
          console.log('✅ 已發文：', quote);
        });
      });
    });
  } catch (error) {
    console.error('❌ 發文失敗：', error.message);
  }
}

// 每天早上 5:00 發文
cron.schedule('0 5 * * *', () => {
  console.log('🕔 執行每日自動發文...');
  postTweet();
});
