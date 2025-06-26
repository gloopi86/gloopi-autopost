const express = require('express');
const cron = require('node-cron');
const { TwitterApi } = require('twitter-api-v2');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();

// === OpenAI 設定 ===
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

// === Twitter 設定 ===
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// === 每天早上 5:00（台灣） → UTC 時區 +8 所以是每天 21:00 UTC ===
cron.schedule('0 21 * * *', async () => {
  try {
    console.log('⏰ 開始產生 Gloopi 語錄...');

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一個綠色、頭上有兩條天線的小可愛角色 Gloopi，要寫一則哲學迷因語錄，融合宇宙觀與網路幽默，風格獨特但簡潔。'
        },
        {
          role: 'user',
          content: '寫一則語錄'
        }
      ]
    });

    const quote = completion.data.choices[0].message.content.trim();
    console.log('✅ 語錄產生完成：', quote);

    await twitterClient.v2.tweet(quote);
    console.log('🐦 發文成功！');
  } catch (error) {
    console.error('❌ 發文失敗：', error);
  }
});

// === Express 保持 Render 醒著 ===
app.get('/', (req, res) => {
  res.send('Gloopi 自動發文機 正常運行中 👾');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gloopi server is running on port ${PORT}`);
});
