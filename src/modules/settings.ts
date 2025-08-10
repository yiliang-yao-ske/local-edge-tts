import { App, Notice, PluginSettingTab, Setting, Platform } from 'obsidian';

// Settings interface and default settings
export interface EdgeTTSPluginSettings {
  selectedVoice: string;
  customVoice: string;
  playbackSpeed: number;

  showNotices: boolean;
  showStatusBarButton: boolean;
  showMenuItems: boolean;

  generateMP3: boolean;
  outputFolder: string;
  embedInNote: boolean;
  replaceSpacesInFilenames: boolean;

  // Text filtering settings
  textFiltering: {
    filterFrontmatter: boolean;
    filterMarkdownLinks: boolean;
    filterCodeBlocks: boolean;
    filterInlineCode: boolean;
    filterHtmlTags: boolean;
    filterTables: boolean;
    filterImages: boolean;
    filterFootnotes: boolean;
    filterComments: boolean;
    filterMathExpressions: boolean;
    filterWikiLinks: boolean;
    filterHighlights: boolean;
    filterCallouts: boolean;
    replaceComparisonSymbols: boolean;
  };

  // Symbol replacement settings
  symbolReplacement: {
    enableCustomReplacements: boolean;
    language: string; // 'auto', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'custom'
    customReplacements: {
      greaterThan: string;
      lessThan: string;
      greaterThanOrEqual: string;
      lessThanOrEqual: string;
    };
  };

  floatingPlayerPosition: { x: number; y: number } | null;
  disablePlaybackControlPopover: boolean;
  enableReplayOption: boolean;
  enableQueueFeature: boolean;
  queueManagerPosition: { x: number; y: number } | null;
  autoPauseOnWindowBlur: boolean;
  chunkSize: number;

  // Experimental and mobile-specific features
  enableExperimentalFeatures: boolean;
  reducedNoticesOnMobile: boolean;

  // Context menu features
  enableContextMenuTTS: boolean;
  enableInlineProgressBar: boolean;
}

// Top voices to be displayed in the dropdown
export const TOP_VOICES = [
  'en-US-AvaMultilingualNeural',
  'en-US-BrianMultilingualNeural',
  'en-US-AndrewNeural',
  'en-US-AriaNeural',
  'en-US-AvaNeural',
  'en-US-ChristopherNeural',
  'en-US-SteffanNeural',
  'en-IE-ConnorNeural',
  'en-GB-RyanNeural',
  'en-GB-SoniaNeural',
  'en-AU-NatashaNeural',
  'en-AU-WilliamNeural',
];

export const DEFAULT_SETTINGS: EdgeTTSPluginSettings = {
  selectedVoice: 'en-US-AvaNeural',
  customVoice: '',
  playbackSpeed: 1.0,

  showNotices: true,
  showStatusBarButton: true,
  showMenuItems: true,

  generateMP3: false,
  outputFolder: 'Note Narration Audio',
  embedInNote: false,
  replaceSpacesInFilenames: false,

  // Text filtering settings
  textFiltering: {
    filterFrontmatter: true,
    filterMarkdownLinks: false, // Disabled by default
    filterCodeBlocks: true,
    filterInlineCode: true,
    filterHtmlTags: true,
    filterTables: true, // This might be one the user wants to adjust
    filterImages: true,
    filterFootnotes: true,
    filterComments: true,
    filterMathExpressions: false,
    filterWikiLinks: false,
    filterHighlights: true, // (this just removes the == — the text should remain)
    filterCallouts: false, // Keep callouts by default
    replaceComparisonSymbols: true, // Enable by default to prevent XML issues
  },

  // Symbol replacement settings
  symbolReplacement: {
    enableCustomReplacements: false, // Disabled by default, uses built-in language detection
    language: 'auto', // Auto-detect based on user locale
    customReplacements: {
      greaterThan: ' greater than ',
      lessThan: ' less than ',
      greaterThanOrEqual: ' greater than or equal to ',
      lessThanOrEqual: ' less than or equal to ',
    },
  },

  floatingPlayerPosition: null,
  disablePlaybackControlPopover: false,
  enableReplayOption: true,
  enableQueueFeature: true,
  queueManagerPosition: null,
  autoPauseOnWindowBlur: false,
  chunkSize: 9000,

  // Experimental and mobile-specific features
  enableExperimentalFeatures: false,
  reducedNoticesOnMobile: true, // Default to true for better mobile UX

  // Context menu features
  enableContextMenuTTS: true, // Enable context menu TTS by default
  enableInlineProgressBar: true, // Enable inline progress bar by default
}

export const defaultSelectedTextMp3Name = 'note';

export class EdgeTTSPluginSettingTab extends PluginSettingTab {
  plugin: any;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Local Edge TTS 设置' });

    // Voice selection
    new Setting(containerEl)
      .setName('语音选择')
      .setDesc('选择要使用的语音')
      .addDropdown(dropdown => {
        TOP_VOICES.forEach(voice => {
          dropdown.addOption(voice, voice);
        });
        dropdown.setValue(this.plugin.settings.selectedVoice);
        dropdown.onChange(async (value) => {
          this.plugin.settings.selectedVoice = value;
          await this.plugin.saveSettings();
        });
      });

    // Show notices setting
    new Setting(containerEl)
      .setName('显示通知')
      .setDesc('开启/关闭处理状态和错误的通知提示')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.showNotices);
        toggle.onChange(async (value) => {
          this.plugin.settings.showNotices = value;
          await this.plugin.saveSettings();
        });
      });

    // Status bar button setting
    new Setting(containerEl)
      .setName('显示状态栏按钮')
      .setDesc('在状态栏显示播放按钮')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.showStatusBarButton);
        toggle.onChange(async (value) => {
          this.plugin.settings.showStatusBarButton = value;
          await this.plugin.saveSettings();
        });
      });

    containerEl.createEl('h3', { text: '右键菜单功能' });

    // Context menu TTS setting
    new Setting(containerEl)
      .setName('启用右键菜单语音朗读')
      .setDesc('在编辑器右键菜单中添加语音朗读功能')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enableContextMenuTTS);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableContextMenuTTS = value;
          await this.plugin.saveSettings();
          new Notice(`右键菜单语音朗读 ${value ? '已启用' : '已禁用'}`);
        });
      });

    // Inline progress bar setting
    new Setting(containerEl)
      .setName('启用内嵌音频进度条')
      .setDesc('允许在鼠标位置插入音频播放进度条')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enableInlineProgressBar);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableInlineProgressBar = value;
          await this.plugin.saveSettings();
          new Notice(`内嵌音频进度条 ${value ? '已启用' : '已禁用'}`);
        });
      });
  }
}
