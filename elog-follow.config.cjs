/**
 * Elog 配置：从 Notion「我的关注」数据库同步到本地 Markdown
 * 用于展示正在看的、在学习的别人的网页或内容
 * 数据库列：名称(Title)、链接(URL)、类型(Select)、描述(Text)、图标(Text,可选)
 * 类型选项：博客、Newsletter、播客、视频、课程、其他
 * 使用：elog sync -e .elog-follow.env -c elog-follow.config.cjs
 */
module.exports = {
  write: {
    platform: 'notion',
    notion: {
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_FOLLOW_ID,
    },
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './content/elog-follow',
      filename: 'title',
      format: 'markdown',
      catalog: false,
      frontMatter: {
        enable: true,
        include: [],
        timeFormat: true,
      },
    },
  },
};
