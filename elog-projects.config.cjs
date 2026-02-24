/**
 * Elog 配置：从 Notion 应用数据库同步到本地 Markdown
 * 数据库列：标题、描述、封面图(Files)、链接、日期、标签、技术栈
 * 使用方式：elog sync -e .elog-projects.env -c elog-projects.config.cjs
 */
module.exports = {
  write: {
    platform: 'notion',
    notion: {
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_PROJECTS_ID,
    },
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './content/elog-projects',
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
