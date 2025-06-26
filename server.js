const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');
const Twit = require('twit');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const express = require('express'); // 重要：Render 需要一個 Web 伺服器防止自動關機

dotenv.config();

const app = express();
app.get('/', (req, res) => res.send('Gloopi bot is running.'));
app.listen(process.env.PORT || 3000, () => console.log('Server started'));

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

const twitter = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// 每天早上 5 點自動發文
cron.schedule('0 5 * * *', async () => {
  try {
    const quote = await generateQuote();
    const imageUrl = await generateImage(quote);
    const imagePath = await downloadImage(imageUrl);
    const imageData = fs.readFileSync(imagePath, { encoding: 'base64' });

    twitter.post('media/upload', { media_data: imageData }, (err, data) => {
      if (err) return console.error('上傳圖片錯誤:', err);

      const mediaId = data.media_id_string;
      const status = { status: quote, media_ids: [mediaId] };

      twitter.post('statuses/update', status, (err) => {
        if (err) console.error('發文錯誤:', err);
        else console.log('✅ 成功發文：', quote);
      });
    });
  } catch (err) {
    console.error('錯誤:', err.message);
  }
});

async function generateQuote() {
  const res = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: '請寫一句融合哲學、迷因、宇宙觀的 Gloopi 語錄。' }]
  });
  return res.data.choices[0].message.content.trim();
}

async function generateImage(prompt) {
  const res = await openai.createImage({
    prompt: 'A cute green alien with two antennae, sitting or moving, random cosmic background',
    n: 1,
    size: '512x512',
  });
  return res.data.data[0].url;
}

async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data, 'binary');
  const imagePath = path.join(__dirname, 'gloopi_image.png');
  fs.writeFileSync(imagePath, imageBuffer);
  return imagePath;
}
