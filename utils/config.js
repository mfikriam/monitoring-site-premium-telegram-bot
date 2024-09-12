const config = {
  bot: {
    token: process.env.BOT_TOKEN,
    chatIds: JSON.parse(process.env.CHAT_IDS),
  },
  nms: {
    gpon: {
      host: process.env.NMS_GPON_HOST,
      username: process.env.NMS_GPON_USERNAME,
      password: process.env.NMS_GPON_PASSWORD,
      port: Number(process.env.NMS_GPON_PORT),
    },
    metro: {
      host: process.env.NMS_METRO_HOST,
      username: process.env.NMS_METRO_USERNAME,
      password: process.env.NMS_METRO_PASSWORD,
      port: Number(process.env.NMS_METRO_PORT),
    },
  },
  ne: [
    {
      username: process.env.NE_USERNAME_1,
      password: process.env.NE_PASSWORD_2,
    },
  ],
};

export default config;
