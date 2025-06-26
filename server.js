require('dotenv').config();

const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const Twit = require('twit');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
app.get('/', (req, res) => res.send('Gloopi bot running'));
app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running...');
});

// OpenAI 設定
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Twitter 設定
const twitter = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// 這邊可以先不排程，之後再開 cron
