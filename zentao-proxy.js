// 禅道 REST API 本地代理
// 作用：解决浏览器跨域问题，把前端页面的请求转发到禅道服务器，并管理 token。
//
// 用法：node zentao-proxy.js [端口]
//   端口默认 8787，也可用环境变量 ZENTAO_PROXY_PORT 指定。
//   需要 Node 18+（依赖内置 fetch）。
//
// 接口：
//   GET  /health             健康检查
//   POST /proxy              通用转发到 {baseUrl}/api.php/v1/{path}
//     body: { baseUrl, account, password, method, path, data }
//     - baseUrl  禅道地址，如 http://192.168.1.10 或 http://192.168.1.10/zentao
//     - account  禅道登录账号
//     - password 禅道登录密码
//     - method   GET/POST/PUT/DELETE，默认 POST
//     - path     相对 api.php/v1 的接口路径，如 tasks、tasks/1/finish、projects
//     - data     请求体（JSON 对象）

'use strict';

const http = require('http');

const PORT = parseInt(process.argv[2] || process.env.ZENTAO_PROXY_PORT || '8787', 10);
const TIMEOUT_MS = 30000;

if (typeof fetch !== 'function') {
  console.error('本代理依赖 Node 内置 fetch，需要 Node 18+。当前 Node 版本过低，请升级后重试。');
  process.exit(1);
}

// token 缓存：key = baseUrl + '|' + account
const tokenCache = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 10 * 1024 * 1024) {
        reject(new Error('请求体过大'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function sendJson(res, status, obj) {
  setCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

// 调用禅道 REST API（带超时与友好错误）
async function callZentao(baseUrl, method, path, headers, body) {
  const normalized = baseUrl.replace(/\/+$/, '');
  const url = normalized + '/api.php/v1/' + path;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    opts.signal = AbortSignal.timeout(TIMEOUT_MS);
  }
  if (body !== undefined && body !== null) {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  let resp;
  try {
    resp = await fetch(url, opts);
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (e && e.name === 'TimeoutError' || /timeout|aborted/i.test(msg)) {
      throw new Error('请求禅道超时（30 秒），请检查禅道服务器是否可达：' + url);
    }
    const code = (e && e.cause && e.cause.code) || '';
    throw new Error('无法连接禅道服务器' + (code ? '（' + code + '）' : '') + '，请检查地址与网络：' + url);
  }
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    data = text;
  }
  // 地址填错时禅道常返回登录页等 HTML，转成可读提示
  if (typeof data === 'string' && /<html|<!doctype/i.test(data)) {
    return {
      status: resp.status,
      data: {
        error: '禅道返回了网页而非接口数据，多半是地址不对（试试在末尾补 /zentao 路径）或该接口不存在',
        raw: data.replace(/\s+/g, ' ').slice(0, 160),
      },
    };
  }
  return { status: resp.status, data };
}

// 获取 token（登录禅道）
async function login(baseUrl, account, password) {
  const r = await callZentao(baseUrl, 'POST', 'tokens', {}, { account, password });
  // 禅道多版本返回结构稍有差异，兼容几种字段名
  const body = r.data || {};
  const token = body.token || (body.data && body.data.token) || null;
  return { status: r.status, token, data: body };
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/health') {
    return sendJson(res, 200, { ok: true, service: 'zentao-proxy', port: PORT });
  }

  if (req.url === '/proxy' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const p = JSON.parse(raw || '{}');
      const { baseUrl, account, password, method = 'POST', path = '', data } = p;

      if (!baseUrl) return sendJson(res, 400, { error: '缺少禅道地址 baseUrl' });
      if (!path) return sendJson(res, 400, { error: '缺少接口路径 path' });

      const cacheKey = baseUrl.replace(/\/+$/, '') + '|' + (account || '');
      let token = tokenCache.get(cacheKey) || null;

      // 若是获取 token 的请求，或本地还没有 token，先登录
      if (path === 'tokens' || !token) {
        if (!account || !password) {
          return sendJson(res, 401, { error: '缺少账号 account 或密码 password，无法登录禅道' });
        }
        const lg = await login(baseUrl, account, password);
        if (lg.status !== 200 && lg.status !== 201) {
          return sendJson(res, lg.status, { error: '登录禅道失败，请检查地址/账号/密码', zen: lg.data });
        }
        if (!lg.token) {
          return sendJson(res, 500, { error: '登录返回缺少 token', zen: lg.data });
        }
        tokenCache.set(cacheKey, lg.token);
        token = lg.token;
        if (path === 'tokens') {
          return sendJson(res, 200, { ok: true, token });
        }
      }

      // 业务请求
      let result = await callZentao(baseUrl, method, path, { Token: token }, data);

      // token 失效（401）时，尝试重新登录后重试一次
      if (result.status === 401 && account && password) {
        const lg = await login(baseUrl, account, password);
        if (lg.status === 200 || lg.status === 201) {
          if (lg.token) {
            tokenCache.set(cacheKey, lg.token);
            result = await callZentao(baseUrl, method, path, { Token: lg.token }, data);
          }
        }
      }

      return sendJson(res, result.status, result.data);
    } catch (e) {
      return sendJson(res, 500, { error: e.message || String(e) });
    }
  }

  return sendJson(res, 404, { error: '未知接口：' + req.url });
});

server.listen(PORT, () => {
  console.log('==============================================');
  console.log('  禅道任务工具 · 本地代理已启动');
  console.log('  地址：http://localhost:' + PORT);
  console.log('  请保持本窗口运行，然后打开 zentao-tool.html');
  console.log('==============================================');
});