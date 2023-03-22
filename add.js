const fs = require('fs');

// 警告ポイントを読み込む関数
function loadPoints() {
  try {
    // ファイルを読み込み、JSONをパースしてMapを作成する
    const data = fs.readFileSync(`./warmpoint_${config.serverID}.json`, 'utf8');
    return new Map(JSON.parse(data));
  } catch (err) {
    // ファイルが存在しない場合は空のMapを返す
    return new Map();
  }
}

// 警告ポイントを保存する関数
function savePoints() {
  try {
    // MapをJSONに変換してファイルに書き込む
    const data = JSON.stringify(Array.from(warnPoints.entries()));
    fs.writeFileSync(`./warmpoint_${config.serverID}.json`, data);
  } catch (err) {
    console.error(err);
  }
}

// サーバーごとに異なるファイル名を使用するため、コンフィグからサーバーIDを取得する
const serverID = config.serverID;

// 新しいクライアントと警告ポイントのマップを作成する
const client = new Discord.Client();
const warnPoints = loadPoints();

// ...

// 警告ポイントを付与する関数
function addPoint(userId) {
  // 警告ポイントがなければ1点、あれば1点増やす
  warnPoints.set(userId, warnPoints.get(userId) ? warnPoints.get(userId) + 1 : 1);

  // 警告ポイントに応じて処罰する（ミュート、キック、BAN）
  const member = client.guilds.cache.get(config.serverID).members.cache.get(userId);
  const point = warnPoints.get(userId);

  // ...

  // ポイントを保存する
  savePoints();
}
