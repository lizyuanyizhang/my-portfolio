/**
 * Elog 配置：从 Notion 随笔数据库同步到本地 Markdown
 * 使用 .cjs 扩展名以兼容 package.json 的 "type": "module"
 * 使用方式：elog sync -e .elog.env -c elog.config.cjs
 */
module.exports = {
  write: {
    platform: 'notion',
    notion: {
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_ID,
    },
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './content/elog-posts',
      filename: 'title',
      format: 'markdown',
      catalog: false,
      frontMatter: {
        enable: true,
        include: ['title', 'date', 'updated', 'description', 'categories', 'tags'],
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
