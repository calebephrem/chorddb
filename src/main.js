// Main \\

const { encrypt, setup, decrypt, dc_call } = require("./functions");
const FormData = require("form-data")
const {
  MessageTooLargeError,
  InvalidTokenError,
  InvalidChannelIdError,
  ChordDBNotStartedError,
  InvalidImageChannel,
} = require("./errors");

class UDB {
  constructor(token, encryption_key, channel_id, img_channel = null, showChorddbMessage = true) {
    this.token = token;
    this.enc_key = encryption_key;
    this.ch_id = channel_id;
    this.isStarted = false;
    this.images = img_channel
    this.debugShow = showChorddbMessage;
  }

  async start() {
    setup(this.token, this.enc_key, this.ch_id);

    const user_info = await dc_call("/users/@me");
    const channel_info = await dc_call(`/channels/${this.ch_id}`);

    if (user_info.id) {
      if (this.debugShow) {
        console.log(
          `\x1b[32m chorddb: connected as ${user_info.username}\x1b[0m`,
        );
      }
    } else {
      console.error(new InvalidTokenError());
      process.exit();
    }

    if (channel_info.id) {
      if (this.debugShow) {
        console.log(
          `\x1b[32m chorddb: linked to channel ${channel_info.name}\x1b[0m`,
        );
      }
    } else {
      console.error(new InvalidChannelIdError());
      process.exit();
    }

    if (this.debugShow) {
      console.log("chorddb: ChordDB is Ready.");
    }
    this.isStarted = true;
  }

  _checkStarted() {
    if (!this.isStarted) {
      console.error(new ChordDBNotStartedError());
      process.exit();
    }
  }

  async write(data) {
    this._checkStarted();

    data = JSON.stringify(data);
    const enc_data = encrypt(data);

    if (enc_data.length > 2000) {
      throw new MessageTooLargeError();
    }

    const r = await dc_call(`/channels/${this.ch_id}/messages`, "POST", {
      content: enc_data,
    });

    if (r.bot) {
      return false;
    } else {
      return true;
    }
  }

  async find(identifier) {
    this._checkStarted();

    let final_data = null;
    const key = identifier["key"];
    const value = identifier["value"];

    let msgs;
    msgs = await dc_call(`/channels/${this.ch_id}/messages`);

    const final = [];

    for (const msg of msgs) {
      const decrypted = decrypt(msg.content);
      const parsed = JSON.parse(decrypted);
      final.push(parsed);
    }

    for (const msg of final) {
      if (msg[key] !== undefined && msg[key] === value) {
        final_data = msg;
        break;
      }
    }

    if (!final_data) {
      return null;
    }

    return final_data;
  }

  async edit(identifier, updates) {
    this._checkStarted();

    let msgs = await dc_call(`/channels/${this.ch_id}/messages`);
    let final = false;

    for (const msg of msgs) {
      try {
        const decrypted = decrypt(msg.content);
        const parsed = JSON.parse(decrypted);

        if (parsed[identifier[0]] === identifier[1]) {
          parsed[updates[0]] = updates[1];

          const newContent = encrypt(JSON.stringify(parsed));
          const r = await dc_call(
            `/channels/${this.ch_id}/messages/${msg.id}`,
            "PATCH",
            { content: newContent },
          );

          if (r.id) {
            final = true;
          }
          break;
        }
      } catch (e) {
        continue;
      }
    }

    return final;
  }

  async read() {
    this._checkStarted();

    let msgs;
    let final = [];
    msgs = await dc_call(`/channels/${this.ch_id}/messages`);

    for (const msg of msgs) {
      final.push(JSON.parse(decrypt(msg.content.toString())));
    }

    if (final.length === 0) {
      return null;
    } else {
      return final;
    }
  }

  async sendImg(name, key, buffer) {
    let Form = new FormData()
    this._checkStarted()

    if (!this.images) {
      throw new InvalidImageChannel();
    }

    Form.append("file", buffer, name)
    Form.append("payload_json", JSON.stringify({
      content: key
    }))


    const res = await dc_call(`/channels/${this.ch_id}/messages`, "POST", Form)

    return res;
  }

  async findImg(key) {
    this._checkStarted();

    if (!this.images) {
      throw new InvalidImageChannel();
    }

    const res = await dc_call(`/channels/${this.ch_id}/messages`);

    if (res) {
      for (const msg of res) {
        if (msg.content === key) {
          return msg.attachments[0]
        }
      }
    } else {
      return null
    }
  }
}

module.exports = UDB;
