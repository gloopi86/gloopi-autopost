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

// OpenAI 初始化
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Twitter 初始化
const twitter = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// 隨機圖檔清單（請把這些圖放在根目錄的 images 資料夾）
const images = [
  'images/gloopi1.png',
  'images/gloopi2.png',
  'images/gloopi3.png',
  'images/gloopi4.png',
];

// 隨機產生語錄
async function generateQuote() {
  const prompt = `
你是 Gloopi，一個坐在星空下的小綠人，說出一句迷因風格的語錄，內容融合宇宙觀、哲學與幽默，不超過 50 字。
語錄範例：「我的價值由你來定，是神話還是笑話，或者兩者都是。」
請只輸出語錄本身。
`;

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.1,
    max_tokens: 100,
  });

  return response.data.choices[0].message.content.trim();
}

// 上傳圖片＋推文
async function postToTwitter() {
  try {
    const quote = await generateQuote();
    const imagePath = images[Math.floor(Math.random() * images.length)];
    const imageData = fs.readFileSync(imagePath, { encoding: 'base64' });

    // 上傳圖片
    const media = await twitter.post('media/upload', { media_data: imageData });
    const mediaIdStr = media.data.media_id_string;

    // 推文
    await twitter.post('statuses/update', {
      status: quote,
      media_ids: [mediaIdStr],
    });

    console.log(`[成功] 已發佈推文：${quote}`);
  } catch (error) {
    console.error('發文失敗：', error.message);
  }
}

// 安排每天早上 5 點（台灣時間）發文
cron.schedule('0 21 * * *', () => {
  console.log('🕔 準備發佈 Gloopi 語錄與圖片...');
  postToTwitter();
});
