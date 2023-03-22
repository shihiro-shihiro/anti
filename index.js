// discord.jsモジュールと設定ファイルを読み込む
const Discord = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

// 新しいクライアントと警告ポイントのマップを作成する
const client = new Discord.Client();
const warnPoints = new Map();

// クライアントが準備完了したら発火するイベント
client.on('ready', () => {
    console.log('Ready!');
});

// クライアントがメッセージを受信したら発火するイベント
client.on('message', async (message) => {
    // ボットからのメッセージは無視する
    if (message.author.bot) return;

    // メッセージが招待URLだったら削除して警告ポイントを付与する（特定のチャンネルは除く）
    if (isInviteURL(message.content) && message.channel.id !== config.inviteChannelID) {
        message.delete();
        addPoint(message.author.id);
    }

    // メッセージが[muted]ロールを持つ人からだったら削除する
    if (message.member.roles.cache.has(config.mutedRoleID)) {
        message.delete();
        return;
    }

    // 5秒以内に4回以上投稿したら警告ポイントを付与する（荒らし対策）
    const messages = await message.channel.messages.fetch({ limit: 5 });
    const lastFive = messages.filter(m => m.author.id === message.author.id);
    if (isSpamming(lastFive)) {
        addPoint(message.author.id);
        return;
    }

    // 同じ内容の投稿が5回以上連続であれば警告ポイントを付与する（荒らし対策）
    const sameContent = messages.filter(m => m.content === message.content);
    if (isRepeating(sameContent)) {
        addPoint(message.author.id);
        return;
    }
});

// 警告ポイントを付与する関数
function addPoint(userId) {
  // 警告ポイントがなければ1点、あれば1点増やす
  warnPoints.set(userId, warnPoints.get(userId) ? warnPoints.get(userId) + 1 : 1);

  // 警告ポイントに応じて処罰する（ミュート、キック、BAN）
  const member = client.guilds.cache.get(config.serverID).members.cache.get(userId);
  const point = warnPoints.get(userId);
  
  switch(point) {
      case config.warnThreshold: // 警告ポイントが設定値なら警告メッセージを送る
          member.send(config.warnMessage);
          break;
      case config.muteThreshold: // 警告ポイントが設定値なら[muted]ロールを付与する
          member.roles.add(config.mutedRoleID).catch(console.error);
          member.send(config.muteMessage);
          break;
      case config.kickThreshold: // 警告ポイントが設定値ならキックする
          member.kick().catch(console.error);
          member.send(config.kickMessage);
          break;
      case config.banThreshold: // 警告ポイントが設定値ならBANする
          member.ban().catch(console.error);
          member.send(config.banMessage);
          break;
      default:
          break;
   }
}

// メッセージが招待URLかどうか判定する関数
function isInviteURL(content) {
   return content.match(/(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[a-z]/g); 
}

// メッセージの集合からスパム行為かどうか判定する関数
function isSpamming(messages) {
    // メッセージが5件未満ならfalse
    if (messages.size < 5) return false;
    // 最初と最後のメッセージの時間差が5秒以内ならtrue
    const first = messages.first();
    const last = messages.last();
    return (last.createdTimestamp - first.createdTimestamp) <= 5000;
}

// メッセージの集合から同じ内容の投稿かどうか判定する関数
function isRepeating(messages) {
    // メッセージが5件未満ならfalse
    if (messages.size < 5) return false;
    // 全てのメッセージが同じ内容ならtrue
    const content = messages.first().content;
    return messages.every(m => m.content === content);
}

// クライアントにログインする（トークンは設定ファイルから取得）
client.login(config.token);
