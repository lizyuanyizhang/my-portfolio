#!/usr/bin/env node
/**
 * 百度翻译 API 连通性测试
 * 用法: node scripts/test-baidu-translate.cjs
 * 需在 .elog.env 中配置 BAIDU_APP_ID、BAIDU_SECRET_KEY
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.elog.env') });
const crypto = require('crypto');

const appId = (process.env.BAIDU_APP_ID || '').trim();
const secret = (process.env.BAIDU_SECRET_KEY || '').trim();

if (!appId || !secret) {
  console.error('❌ 未找到 BAIDU_APP_ID 或 BAIDU_SECRET_KEY，请检查 .elog.env');
  process.exit(1);
}

console.log('AppID 长度:', appId.length, '| 密钥长度:', secret.length);
console.log('AppID 前4后4:', appId.slice(0, 4) + '...' + appId.slice(-4));
console.log('密钥前4后4:', secret.slice(0, 4) + '...' + secret.slice(-4));
console.log('');

const q = '你好';
const salt = String(Date.now());
const signStr = appId + q + salt + secret;
const sign = crypto.createHash('md5').update(signStr).digest('hex');

const params = new URLSearchParams({ q, from: 'zh', to: 'en', appid: appId, salt, sign });
const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate?' + params.toString();

fetch(url)
  .then((res) => res.json())
  .then((json) => {
    if (json.error_code) {
      console.error('❌ API 返回错误:', json.error_code, json.error_msg);
      console.error('提示: 54001 通常是密钥错误，请到 https://fanyi-api.baidu.com/ 确认密钥');
      process.exit(1);
    }
    console.log('✅ 翻译成功:', q, '->', json?.trans_result?.[0]?.dst);
  })
  .catch((err) => {
    console.error('❌ 请求失败:', err.message);
    process.exit(1);
  });
