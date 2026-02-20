/**
 * Elog 配置：从 Notion 摄影数据库同步到本地 Markdown
 * 数据库列：标题、文件和媒体(Files)、拍摄地点、日期、介绍（支持任意列名，include 空则保留全部属性）
 * 使用方式：elog sync -e .elog-photos.env -c elog-photos.config.cjs
 */
module.exports = {
  write: {
    platform: 'notion',
    notion: {
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_PHOTOS_ID,
    },
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './content/elog-photos',
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
  image: {
    enable: true,
    platform: 'local',
    local: {
      outputDir: './public/images/elog',
      prefixKey: '/images/elog',
    },
  },
};
