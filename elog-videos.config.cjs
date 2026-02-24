/**
 * Elog 配置：从 Notion 影像数据库同步到本地 Markdown
 * 数据库列建议：标题、视频链接(URL)、描述、封面(URL)、时长、标签(多选)、日期
 * 标签选项：学习、vlog、AI视频
 * 使用：elog sync -e .elog-videos.env -c elog-videos.config.cjs
 */
module.exports = {
  write: {
    platform: 'notion',
    notion: {
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_VIDEOS_ID,
    },
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './content/elog-videos',
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
