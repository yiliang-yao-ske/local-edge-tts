const obsidian = require('obsidian');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 语音选项 - 按语言分类
const VOICE_OPTIONS_BY_LANGUAGE = {
  chinese: {
    "zh-CN-XiaoxiaoNeural": "中文 (普通话，大陆) - 晓晓 (女)",
    "zh-CN-YunxiNeural": "中文 (普通话，大陆) - 云希 (男)",
    "zh-CN-YunyangNeural": "中文 (普通话，大陆) - 云扬 (男)",
    "zh-CN-XiaoyiNeural": "中文 (普通话，大陆) - 晓伊 (女)",
    "zh-CN-YunjianNeural": "中文 (普通话，大陆) - 云健 (男)",
    "zh-CN-YunxiaNeural": "中文 (普通话，大陆) - 云夏 (男)",
    "zh-CN-XiaochenNeural": "中文 (普通话，大陆) - 晓辰 (女)",
    "zh-CN-XiaohanNeural": "中文 (普通话，大陆) - 晓涵 (女)",
    "zh-CN-XiaomoNeural": "中文 (普通话，大陆) - 晓墨 (女)",
    "zh-CN-XiaoruiNeural": "中文 (普通话，大陆) - 晓睿 (女)",
    "zh-CN-XiaoxuanNeural": "中文 (普通话，大陆) - 晓萱 (女)",
    "zh-CN-XiaoyanNeural": "中文 (普通话，大陆) - 晓颜 (女)",
    "zh-CN-XiaozhenNeural": "中文 (普通话，大陆) - 晓甄 (女)",
    "zh-CN-YunfengNeural": "中文 (普通话，大陆) - 云枫 (男)",
    "zh-CN-YunhaoNeural": "中文 (普通话，大陆) - 云皓 (男)",
    "zh-CN-YunyeNeural": "中文 (普通话，大陆) - 云野 (男)",
    "zh-CN-YunzeNeural": "中文 (普通话，大陆) - 云泽 (男)",
    "zh-TW-HsiaoChenNeural": "中文 (台湾) - 晓臻 (女)",
    "zh-TW-YunJheNeural": "中文 (台湾) - 云哲 (男)",
    "zh-TW-HsiaoYuNeural": "中文 (台湾) - 晓雨 (女)"
  },
  english: {
    "en-US-AriaNeural": "English (US) - Aria (Female)",
    "en-US-JennyNeural": "English (US) - Jenny (Female)", 
    "en-US-GuyNeural": "English (US) - Guy (Male)",
    "en-US-AvaNeural": "English (US) - Ava (Female)",
    "en-US-BrianNeural": "English (US) - Brian (Male)",
    "en-US-ChristopherNeural": "English (US) - Christopher (Male)",
    "en-US-EmmaNeural": "English (US) - Emma (Female)",
    "en-US-MichelleNeural": "English (US) - Michelle (Female)",
    "en-US-RogerNeural": "English (US) - Roger (Male)",
    "en-US-SteffanNeural": "English (US) - Steffan (Male)",
    "en-GB-SoniaNeural": "English (UK) - Sonia (Female)",
    "en-GB-RyanNeural": "English (UK) - Ryan (Male)",
    "en-GB-LibbyNeural": "English (UK) - Libby (Female)",
    "en-GB-AbbiNeural": "English (UK) - Abbi (Female)",
    "en-GB-AlfieNeural": "English (UK) - Alfie (Male)",
    "en-GB-BellaNeural": "English (UK) - Bella (Female)",
    "en-GB-ElliotNeural": "English (UK) - Elliot (Male)",
    "en-GB-EthanNeural": "English (UK) - Ethan (Male)",
    "en-GB-HollieNeural": "English (UK) - Hollie (Female)",
    "en-GB-MaisieNeural": "English (UK) - Maisie (Female)",
    "en-GB-NoahNeural": "English (UK) - Noah (Male)",
    "en-GB-OliverNeural": "English (UK) - Oliver (Male)",
    "en-GB-OliviaNeural": "English (UK) - Olivia (Female)",
    "en-GB-ThomasNeural": "English (UK) - Thomas (Male)",
    "en-AU-NatashaNeural": "English (Australia) - Natasha (Female)",
    "en-AU-WilliamNeural": "English (Australia) - William (Male)",
    "en-AU-AnnetteNeural": "English (Australia) - Annette (Female)",
    "en-AU-CarlyNeural": "English (Australia) - Carly (Female)",
    "en-AU-DarrenNeural": "English (Australia) - Darren (Male)",
    "en-AU-DuncanNeural": "English (Australia) - Duncan (Male)",
    "en-AU-ElsieNeural": "English (Australia) - Elsie (Female)",
    "en-AU-FreyaNeural": "English (Australia) - Freya (Female)",
    "en-AU-JoanneNeural": "English (Australia) - Joanne (Female)",
    "en-AU-KenNeural": "English (Australia) - Ken (Male)",
    "en-AU-KimNeural": "English (Australia) - Kim (Female)",
    "en-AU-NeilNeural": "English (Australia) - Neil (Male)",
    "en-AU-TimNeural": "English (Australia) - Tim (Male)",
    "en-AU-TinaNeural": "English (Australia) - Tina (Female)"
  },
  spanish: {
    "es-ES-ElviraNeural": "Español (España) - Elvira (Mujer)",
    "es-ES-AlvaroNeural": "Español (España) - Álvaro (Hombre)",
    "es-MX-DaliaNeural": "Español (México) - Dalia (Mujer)",
    "es-MX-JorgeNeural": "Español (México) - Jorge (Hombre)",
    "es-AR-ElenaNeural": "Español (Argentina) - Elena (Mujer)",
    "es-AR-TomasNeural": "Español (Argentina) - Tomás (Hombre)"
  }
};

// 兼容性：合并所有语音选项
let VOICE_OPTIONS = {
  ...VOICE_OPTIONS_BY_LANGUAGE.chinese,
  ...VOICE_OPTIONS_BY_LANGUAGE.english,
  ...VOICE_OPTIONS_BY_LANGUAGE.spanish
};

const DEFAULT_SETTINGS = {
  // 每种语言的语音设置
  voiceSettings: {
    chinese: 'zh-CN-XiaoxiaoNeural',    // 中文默认语音
    english: 'en-US-AriaNeural',        // 英语默认语音
    spanish: 'es-ES-ElviraNeural'       // 西班牙语默认语音
  },
  // 保留向后兼容性
  selectedVoice: 'zh-CN-XiaoxiaoNeural',
  playbackSpeed: 1.0,
  showNotices: true,
  showStatusBarButton: true,
  showMenuItems: true,
  generateMP3: false,
  outputFolder: 'Note Narration Audio',
  embedInNote: false,
  replaceSpacesInFilenames: false,
  textFiltering: {
    filterFrontmatter: true,
    filterMarkdownLinks: false,
    filterCodeBlocks: true,
    filterInlineCode: true,
    filterHtmlTags: true,
    filterTables: true,
    filterImages: true,
    filterFootnotes: true,
    filterComments: true,
    filterMathExpressions: false,
    filterWikiLinks: false,
    filterHighlights: true,
    filterCallouts: false,
    replaceComparisonSymbols: true,
  },
  symbolReplacement: {
    enableCustomReplacements: false,
    language: 'auto',
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
  enableExperimentalFeatures: false,
  reducedNoticesOnMobile: true,
  // 右键菜单功能设置
  enableContextMenuTTS: true,        // 右键菜单语音朗读
  enableContextMenuMP3: true,        // 右键菜单MP3生成
  enableInlineProgressBar: true      // 内嵌进度条
};

// Simple text filtering function
function filterMarkdown(text) {
  let processedText = text;
  
  // Remove frontmatter
  processedText = processedText.replace(/^-{3}[\s\S]*?-{3}\n?/, '');
  
  // Remove code blocks
  processedText = processedText.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code markers
  processedText = processedText.replace(/`([^`]*)`/g, '$1');
  
  // Remove markdown links but keep text
  processedText = processedText.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  
  // Remove wiki links but keep text
  processedText = processedText.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2');
  processedText = processedText.replace(/\[\[([^\]]*)\]\]/g, '$1');
  
  // Remove images
  processedText = processedText.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
  processedText = processedText.replace(/!\[\[([^\]]*)\]\]/g, '');
  
  // Remove bold and italic markers
  processedText = processedText.replace(/(\*\*|__)(.*?)\1/g, '$2');
  processedText = processedText.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Remove highlight markers
  processedText = processedText.replace(/==([^=]*)==/g, '$1');
  
  // Remove headers, list markers, etc.
  processedText = processedText
    .replace(/^[#*-]+\s*/gm, '')
    .replace(/^[\-\+\*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '');
  
  // Clean up whitespace
  processedText = processedText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
  
  return processedText;
}

// Edge TTS class using Python script
class EdgeTTS {
  constructor(settings, pluginDir) {
    this.settings = settings;
    this.pluginDir = pluginDir;
    this.isPlaying = false;
    this.currentAudio = null;
    this.pythonScript = path.join(pluginDir, 'tts_helper.py');
  }
  
  // 语言检测函数
  detectLanguage(text) {
    // 移除markdown语法，清理文本
    const cleanText = text.replace(/[#*_`>\-\[\]()]/g, ' ').trim();
    
    // 检测中文字符
    const chineseRegex = /[\u4e00-\u9fff]/;
    if (chineseRegex.test(cleanText)) {
      return 'zh';
    }
    
    // 检测西班牙语常见词汇
    const spanishWords = /\b(el|la|los|las|de|que|y|en|un|una|es|se|no|te|lo|le|da|su|por|son|con|para|al|del|está|todo|pero|más|hacer|muy|puede|ahora|cada|dijo|desde|has|hasta|donde|mientras|tanto|antes|después|durante|entre|hacia|según|sobre|tras|aunque|sino|porque|cuando|como|qué|quién|cómo|dónde|cuál|cuáles|cuándo|cuánto|cuánta|cuántos|cuántas)\b/i;
    if (spanishWords.test(cleanText)) {
      return 'es';
    }
    
    // 默认为英语
    return 'en';
  }
  
  // 根据语言选择合适的语音
  selectVoiceForLanguage(language) {
    // 确保voiceSettings存在
    if (!this.settings.voiceSettings) {
      this.settings.voiceSettings = {
        chinese: 'zh-CN-XiaoxiaoNeural',
        english: 'en-US-AriaNeural', 
        spanish: 'es-ES-ElviraNeural'
      };
    }

    // 根据检测到的语言选择对应的语音设置
    let selectedVoice;
    switch (language) {
      case 'zh':
        selectedVoice = this.settings.voiceSettings.chinese;
        console.log(`使用中文语音设置: ${selectedVoice}`);
        break;
      case 'es':
        selectedVoice = this.settings.voiceSettings.spanish;
        console.log(`使用西班牙语语音设置: ${selectedVoice}`);
        break;
      case 'en':
      default:
        selectedVoice = this.settings.voiceSettings.english;
        console.log(`使用英语语音设置: ${selectedVoice}`);
    }
    
    // 验证选择的语音是否在可用列表中
    const availableVoices = VOICE_OPTIONS_BY_LANGUAGE[this.getLanguageKey(language)];
    if (selectedVoice && availableVoices && availableVoices[selectedVoice]) {
      return selectedVoice;
    }
    
    // 如果语音无效，使用该语言的第一个可用语音
    console.warn(`语音 ${selectedVoice} 无效或不可用，使用默认语音`);
    switch (language) {
      case 'zh':
        return Object.keys(VOICE_OPTIONS_BY_LANGUAGE.chinese)[0] || 'zh-CN-XiaoxiaoNeural';
      case 'es':
        return Object.keys(VOICE_OPTIONS_BY_LANGUAGE.spanish)[0] || 'es-ES-ElviraNeural';
      case 'en':
      default:
        return Object.keys(VOICE_OPTIONS_BY_LANGUAGE.english)[0] || 'en-US-AriaNeural';
    }
  }
  
  // 获取语言对应的键名
  getLanguageKey(language) {
    switch (language) {
      case 'zh': return 'chinese';
      case 'es': return 'spanish';
      case 'en': return 'english';
      default: return 'english';
    }
  }
  
  // 根据语音名称获取语言
  getVoiceLanguage(voiceName) {
    if (voiceName.startsWith('zh-')) {
      return 'zh';
    } else if (voiceName.startsWith('es-')) {
      return 'es';
    } else if (voiceName.startsWith('en-')) {
      return 'en';
    }
    return 'en'; // 默认英语
  }
  
  // 获取语言对应的正确语音（考虑用户设置）
  getCorrectedVoice(language) {
    // 优先使用用户设置的语音（如果语言匹配）
    if (this.settings.selectedVoice) {
      const selectedVoiceLanguage = this.getVoiceLanguage(this.settings.selectedVoice);
      if (selectedVoiceLanguage === language) {
        return this.settings.selectedVoice;
      }
    }
    
    // 否则使用默认语音
    switch (language) {
      case 'zh':
        return 'zh-CN-XiaoxiaoNeural';
      case 'es':
        return 'es-ES-ElviraNeural';
      case 'en':
      default:
        return 'en-US-AriaNeural';
    }
  }

  async speak(text) {
    try {
      // Stop any current playback
      this.stop();
      
      if (!text.trim()) {
        throw new Error('No text to speak');
      }
      
      // 预先清理文本以确保一致性
      const preCleanedText = text
        .replace(/\*\*/g, '')           // 移除markdown粗体标记
        .replace(/\*/g, '')             // 移除markdown斜体标记
        .replace(/`([^`]*)`/g, '$1')    // 移除行内代码标记但保留内容
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 移除链接但保留文本
        .replace(/[#>]/g, '')           // 移除标题和引用标记
        .trim();
      
      // 检测文本语言并选择合适的语音
      const detectedLanguage = this.detectLanguage(preCleanedText);
      let voice = this.selectVoiceForLanguage(detectedLanguage);
      
      console.log(`[TTS修复版本] 检测到语言: ${detectedLanguage}, 选择语音: ${voice}`);
      console.log(`[TTS修复版本] 原始文本: ${text.substring(0, 50)}...`);
      console.log(`[TTS修复版本] 用户选定语音: "${this.settings.selectedVoice}"`);
      
      // 验证语音选择是否正确
      const voiceLanguage = this.getVoiceLanguage(voice);
      if (voiceLanguage !== detectedLanguage) {
        console.error(`[TTS错误] 语音语言 ${voiceLanguage} 与检测语言 ${detectedLanguage} 不匹配！`);
        // 强制使用正确的语音
        const correctedVoice = this.getCorrectedVoice(detectedLanguage);
        console.log(`[TTS修复] 强制使用正确语音: ${correctedVoice}`);
        voice = correctedVoice; // 直接修正语音，避免递归
      }
      
      // 获取语速设置
      const rate = this.convertSpeedToRate(this.settings.playbackSpeed);
      
      // 生成音频文件（使用预清理的文本）
      const audioFile = await this.generateAudio(preCleanedText, voice, rate);
      
      if (!audioFile || !fs.existsSync(audioFile)) {
        throw new Error('Failed to generate audio file');
      }
      
      // 播放音频
      await this.playAudio(audioFile);
      
    } catch (error) {
      console.error('TTS Error:', error);
      throw error;
    }
  }
  
  async generateAudio(text, voice, rate) {
    return new Promise((resolve, reject) => {
      console.log('Generating audio with:', { text: text.substring(0, 50) + '...', voice, rate });
      
      // 清理文本，确保没有特殊字符引起问题
      const cleanText = text
        .replace(/\*\*/g, '')           // 移除markdown粗体标记
        .replace(/\*/g, '')             // 移除markdown斜体标记
        .replace(/"/g, '')              // 移除双引号
        .replace(/'/g, '')              // 移除单引号
        .replace(/`/g, '')              // 移除反引号
        .replace(/\[([^\]]*)\]/g, '$1') // 移除方括号但保留内容
        .replace(/\(([^)]*)\)/g, '')    // 移除圆括号及内容
        .replace(/[#>-]/g, '')          // 移除markdown标记
        .replace(/[\\]/g, '')           // 移除反斜杠
        .replace(/[|&;$<>]/g, '')       // 移除可能导致shell解析问题的字符
        .replace(/\r?\n/g, ' ')         // 将换行符替换为空格
        .replace(/\s+/g, ' ')           // 将多个空格合并为单个空格
        .trim();
      
      // 使用JSON文件传递参数以避免命令行解析问题
      const tempConfigFile = path.join(this.pluginDir, 'temp', `tts_config_${Date.now()}.json`);
      const config = {
        command: 'speak',
        text: cleanText,
        voice: voice,
        rate: rate
      };
      
      // 写入配置文件
      try {
        const tempDir = path.join(this.pluginDir, 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        fs.writeFileSync(tempConfigFile, JSON.stringify(config, null, 2), 'utf8');
      } catch (error) {
        reject(new Error(`Failed to write config file: ${error.message}`));
        return;
      }
      
      const args = [
        this.pythonScript,
        '--config', tempConfigFile
      ];
      
      console.log('Executing python with config file:', tempConfigFile);
      console.log('Text length before cleaning:', text.length);
      console.log('Text length after cleaning:', cleanText.length);
      console.log('Cleaned text preview:', cleanText.substring(0, 100));
      
      // 在Windows上尝试python3，如果失败则使用python
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      const pythonProcess = spawn(pythonCommand, args, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          LANG: 'en_US.UTF-8',
          LC_ALL: 'en_US.UTF-8'
        },
        shell: false,  // 禁用shell模式避免参数解析问题
        windowsVerbatimArguments: true  // Windows下保持参数原样
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.setEncoding('utf8');
      pythonProcess.stderr.setEncoding('utf8');
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data;
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data;
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script execution error, exit code:', code);
          console.error('stderr:', stderr);
          console.error('stdout:', stdout);
          
          let errorMessage = 'TTS generation failed: ';
          if (stderr) {
            errorMessage += stderr;
            
            // 如果是语音不可用错误，尝试备用语音
            if (stderr.includes('NoAudioReceived') || stderr.includes('No audio was received')) {
              console.warn(`语音 ${voice} 不可用，尝试使用备用语音`);
              
              // 获取当前语言的备用语音
              const currentLanguage = this.getVoiceLanguage(voice);
              const availableVoices = VOICE_OPTIONS_BY_LANGUAGE[this.getLanguageKey(currentLanguage)];
              const backupVoice = Object.keys(availableVoices)[0]; // 使用第一个可用语音
              
              if (backupVoice && backupVoice !== voice) {
                console.log(`尝试备用语音: ${backupVoice}`);
                // 递归调用但使用备用语音
                this.generateAudio(text, backupVoice, rate)
                  .then(resolve)
                  .catch(reject);
                return;
              }
            }
          } else {
            errorMessage += `Process exited with code ${code}`;
          }
          
          reject(new Error(errorMessage));
          return;
        }
        
        console.log('Python script output:', stdout);
        
        if (!stdout.trim()) {
          reject(new Error('Python script returned empty output'));
          return;
        }
        
        try {
          const result = JSON.parse(stdout.trim());
          if (result.success) {
            console.log('Audio file generated successfully:', result.file);
            resolve(result.file);
          } else {
            reject(new Error(result.error || 'Unknown error from Python script'));
          }
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          console.error('Raw output:', stdout);
          reject(new Error(`Invalid JSON response from TTS script: ${parseError.message}`));
        }
        
        // 清理临时配置文件
        try {
          if (fs.existsSync(tempConfigFile)) {
            fs.unlinkSync(tempConfigFile);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp config file:', cleanupError);
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
  
  async playAudio(audioFile) {
    return new Promise((resolve, reject) => {
      console.log('Attempting to play audio file:', audioFile);
      
      // 检查文件是否存在
      if (!fs.existsSync(audioFile)) {
        reject(new Error(`音频文件不存在: ${audioFile}`));
        return;
      }
      
      try {
        // 读取音频文件为 ArrayBuffer
        const audioData = fs.readFileSync(audioFile);
        console.log(`音频文件大小: ${audioData.length} bytes`);
        
        if (audioData.length === 0) {
          reject(new Error(`音频文件为空: ${audioFile}`));
          return;
        }
        
        // 创建 Blob URL 以安全地播放音频
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const audioURL = URL.createObjectURL(blob);
        
        console.log('Created blob URL for audio playback');
        
        this.currentAudio = new Audio(audioURL);
        
        // 错误处理
        this.currentAudio.onerror = (event) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioURL); // 清理 blob URL
          this.cleanup(audioFile);
          
          let errorMessage = '音频播放失败: ';
          
          if (event.target && event.target.error) {
            const error = event.target.error;
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMessage += '播放被中止';
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMessage += '网络错误';
                break;
              case error.MEDIA_ERR_DECODE:
                errorMessage += '音频解码失败，文件可能损坏';
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage += '音频格式不支持';
                break;
              default:
                errorMessage += `未知错误 (错误代码: ${error.code})`;
            }
          } else {
            errorMessage += '无详细错误信息';
          }
          
          console.error('Audio error details:', event);
          reject(new Error(errorMessage));
        };
        
        this.currentAudio.onloadstart = () => {
          console.log('开始加载音频文件');
        };
        
        this.currentAudio.oncanplay = () => {
          console.log('音频文件可以播放');
        };
        
        this.currentAudio.onended = () => {
          console.log('音频播放完成');
          this.isPlaying = false;
          URL.revokeObjectURL(audioURL); // 清理 blob URL
          this.cleanup(audioFile);
          resolve();
        };
        
        this.isPlaying = true;
        
        // 播放音频
        this.currentAudio.play().catch((error) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioURL); // 清理 blob URL
          this.cleanup(audioFile);
          
          let errorMessage = '无法开始播放音频: ';
          
          switch (error.name) {
            case 'NotAllowedError':
              errorMessage += '浏览器阻止了音频播放，可能需要用户交互';
              break;
            case 'NotSupportedError':
              errorMessage += '音频格式不支持';
              break;
            case 'AbortError':
              errorMessage += '播放被中止';
              break;
            default:
              errorMessage += error.message || '未知错误';
          }
          
          console.error('Play error details:', error);
          reject(new Error(errorMessage));
        });
        
      } catch (readError) {
        reject(new Error(`无法读取音频文件: ${readError.message}`));
      }
    });
  }
  
  convertSpeedToRate(speed) {
    // 将数字速度转换为edge-tts的百分比格式
    const percentage = Math.round((speed - 1) * 100);
    if (percentage === 0) return '+0%';
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  }
  
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      
      // 清理 blob URL
      if (this.currentAudio.src && this.currentAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(this.currentAudio.src);
      }
      
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }
  
  // 生成MP3文件到指定目录
  async generateMP3(text, voice, outputPath) {
    return new Promise((resolve, reject) => {
      console.log('Generating MP3 with:', { text: text.substring(0, 50) + '...', voice, outputPath });
      
      // 清理文本，确保没有特殊字符引起问题
      const cleanText = text
        .replace(/\*\*/g, '')           // 移除markdown粗体标记
        .replace(/\*/g, '')             // 移除markdown斜体标记
        .replace(/"/g, '')              // 移除双引号
        .replace(/'/g, '')              // 移除单引号
        .replace(/`/g, '')              // 移除反引号
        .replace(/\[([^\]]*)\]/g, '$1') // 移除方括号但保留内容
        .replace(/\(([^)]*)\)/g, '')    // 移除圆括号及内容
        .replace(/[#>-]/g, '')          // 移除markdown标记
        .replace(/[\\]/g, '')           // 移除反斜杠
        .replace(/[|&;$<>]/g, '')       // 移除可能导致shell解析问题的字符
        .replace(/\r?\n/g, ' ')         // 将换行符替换为空格
        .replace(/\s+/g, ' ')           // 将多个空格合并为单个空格
        .trim();
      
      // 获取语速设置
      const rate = this.convertSpeedToRate(this.settings.playbackSpeed);
      
      // 使用JSON文件传递参数以避免命令行解析问题
      const tempConfigFile = path.join(this.pluginDir, 'temp', `tts_config_${Date.now()}.json`);
      const config = {
        command: 'speak',
        text: cleanText,
        voice: voice,
        rate: rate,
        output: outputPath  // 指定输出路径
      };
      
      // 写入配置文件
      try {
        const tempDir = path.join(this.pluginDir, 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        fs.writeFileSync(tempConfigFile, JSON.stringify(config, null, 2), 'utf8');
      } catch (error) {
        reject(new Error(`Failed to write config file: ${error.message}`));
        return;
      }
      
      const args = [
        this.pythonScript,
        '--config', tempConfigFile
      ];
      
      console.log('Executing python for MP3 generation with config file:', tempConfigFile);
      
      // 在Windows上尝试python3，如果失败则使用python
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      const pythonProcess = spawn(pythonCommand, args, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          LANG: 'en_US.UTF-8',
          LC_ALL: 'en_US.UTF-8'
        },
        shell: false,  // 禁用shell模式避免参数解析问题
        windowsVerbatimArguments: true  // Windows下保持参数原样
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.setEncoding('utf8');
      pythonProcess.stderr.setEncoding('utf8');
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data;
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data;
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script execution error, exit code:', code);
          console.error('stderr:', stderr);
          console.error('stdout:', stdout);
          
          let errorMessage = 'MP3 generation failed: ';
          if (stderr) {
            errorMessage += stderr;
          } else {
            errorMessage += `Process exited with code ${code}`;
          }
          
          reject(new Error(errorMessage));
          return;
        }
        
        console.log('Python script output:', stdout);
        
        if (!stdout.trim()) {
          reject(new Error('Python script returned empty output'));
          return;
        }
        
        try {
          const result = JSON.parse(stdout.trim());
          if (result.success) {
            console.log('MP3 file generated successfully:', result.file);
            resolve({
              success: true,
              file: result.file,
              filename: path.basename(result.file)
            });
          } else {
            reject(new Error(result.error || 'Unknown error from Python script'));
          }
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          console.error('Raw output:', stdout);
          reject(new Error(`Invalid JSON response from TTS script: ${parseError.message}`));
        }
        
        // 清理临时配置文件
        try {
          if (fs.existsSync(tempConfigFile)) {
            fs.unlinkSync(tempConfigFile);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp config file:', cleanupError);
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
  
  cleanup(audioFile) {
    // 清理临时文件
    if (audioFile && fs.existsSync(audioFile)) {
      try {
        fs.unlinkSync(audioFile);
      } catch (error) {
        console.warn('Failed to cleanup temp audio file:', error);
      }
    }
  }
  
  async loadVoices() {
    // 从Python脚本加载语音选项
    return new Promise((resolve) => {
      const command = `python "${this.pythonScript}" list-voices`;
      
      exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          console.warn('Failed to load voices from Python script:', error);
          resolve(VOICE_OPTIONS); // 使用默认选项
          return;
        }
        
        try {
          const voices = JSON.parse(stdout);
          VOICE_OPTIONS = voices;
          resolve(voices);
        } catch (parseError) {
          console.warn('Failed to parse voice list:', parseError);
          resolve(VOICE_OPTIONS); // 使用默认选项
        }
      });
    });
  }
  
  updateSettings(settings) {
    this.settings = settings;
  }
}

// Settings tab
class EdgeTTSPluginSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Local Edge TTS 设置' });

    // 添加语音类别分组说明
    containerEl.createEl('h3', { text: '语音选择' });
    
    const voiceInfo = containerEl.createEl('div', {
      cls: 'edge-tts-info-div'
    });
    
    const infoText = document.createElement('p');
    infoText.innerHTML = `
      <strong>🎯 智能语音选择</strong><br/>
      • 支持中文、英语、西班牙语的高质量神经网络语音<br/>
      • 自动检测文本语言并使用对应语音设置<br/>
      • 每种语言可独立选择语音，无需重启<br/>
      • 语音切换实时生效，支持多语言混合内容
    `;
    voiceInfo.appendChild(infoText);

    // 中文语音选择
    new obsidian.Setting(containerEl)
      .setName('中文语音')
      .setDesc('选择中文 TTS 语音（用于中文内容朗读）')
      .addDropdown(dropdown => {
        // 添加中文语音选项
        for (const [voiceId, voiceName] of Object.entries(VOICE_OPTIONS_BY_LANGUAGE.chinese)) {
          dropdown.addOption(voiceId, voiceName);
        }
        
        // 确保voiceSettings存在
        if (!this.plugin.settings.voiceSettings) {
          this.plugin.settings.voiceSettings = {
            chinese: 'zh-CN-XiaoxiaoNeural',
            english: 'en-US-AriaNeural',
            spanish: 'es-ES-ElviraNeural'
          };
        }
        
        dropdown.setValue(this.plugin.settings.voiceSettings.chinese);
        dropdown.onChange(async (value) => {
          this.plugin.settings.voiceSettings.chinese = value;
          await this.plugin.saveSettings();
          
          if (this.plugin.settings.showNotices) {
            const voiceName = VOICE_OPTIONS_BY_LANGUAGE.chinese[value] || value;
            new obsidian.Notice(`中文语音已切换到: ${voiceName}`);
          }
        });
      })
      .addButton(button => {
        button.setButtonText('试听')
          .setTooltip('试听中文语音')
          .onClick(async () => {
            const testText = '你好，这是中文语音测试。欢迎使用 Edge TTS 插件。';
            
            try {
              button.setButtonText('播放中...');
              button.setDisabled(true);
              
              await this.plugin.tts.speak(testText);
              
              button.setButtonText('试听');
              button.setDisabled(false);
            } catch (error) {
              console.error('中文语音测试失败:', error);
              new obsidian.Notice('中文语音测试失败: ' + error.message);
              button.setButtonText('试听');
              button.setDisabled(false);
            }
          });
      });

    // 英语语音选择
    new obsidian.Setting(containerEl)
      .setName('英语语音')
      .setDesc('选择英语 TTS 语音（用于英语内容朗读）')
      .addDropdown(dropdown => {
        // 添加英语语音选项
        for (const [voiceId, voiceName] of Object.entries(VOICE_OPTIONS_BY_LANGUAGE.english)) {
          dropdown.addOption(voiceId, voiceName);
        }
        
        dropdown.setValue(this.plugin.settings.voiceSettings.english);
        dropdown.onChange(async (value) => {
          this.plugin.settings.voiceSettings.english = value;
          await this.plugin.saveSettings();
          
          if (this.plugin.settings.showNotices) {
            const voiceName = VOICE_OPTIONS_BY_LANGUAGE.english[value] || value;
            new obsidian.Notice(`英语语音已切换到: ${voiceName}`);
          }
        });
      })
      .addButton(button => {
        button.setButtonText('Test')
          .setTooltip('Test English voice')
          .onClick(async () => {
            const testText = 'Hello, this is an English voice test. Welcome to Edge TTS plugin.';
            
            try {
              button.setButtonText('Playing...');
              button.setDisabled(true);
              
              await this.plugin.tts.speak(testText);
              
              button.setButtonText('Test');
              button.setDisabled(false);
            } catch (error) {
              console.error('英语语音测试失败:', error);
              new obsidian.Notice('英语语音测试失败: ' + error.message);
              button.setButtonText('Test');
              button.setDisabled(false);
            }
          });
      });

    // 西班牙语语音选择
    new obsidian.Setting(containerEl)
      .setName('西班牙语语音')
      .setDesc('选择西班牙语 TTS 语音（用于西班牙语内容朗读）')
      .addDropdown(dropdown => {
        // 添加西班牙语语音选项
        for (const [voiceId, voiceName] of Object.entries(VOICE_OPTIONS_BY_LANGUAGE.spanish)) {
          dropdown.addOption(voiceId, voiceName);
        }
        
        dropdown.setValue(this.plugin.settings.voiceSettings.spanish);
        dropdown.onChange(async (value) => {
          this.plugin.settings.voiceSettings.spanish = value;
          await this.plugin.saveSettings();
          
          if (this.plugin.settings.showNotices) {
            const voiceName = VOICE_OPTIONS_BY_LANGUAGE.spanish[value] || value;
            new obsidian.Notice(`西班牙语语音已切换到: ${voiceName}`);
          }
        });
      })
      .addButton(button => {
        button.setButtonText('Probar')
          .setTooltip('Probar voz en español')
          .onClick(async () => {
            const testText = 'Hola, esta es una prueba de voz en español. Bienvenido al plugin Edge TTS.';
            
            try {
              button.setButtonText('Reproduciendo...');
              button.setDisabled(true);
              
              await this.plugin.tts.speak(testText);
              
              button.setButtonText('Probar');
              button.setDisabled(false);
            } catch (error) {
              console.error('西班牙语语音测试失败:', error);
              new obsidian.Notice('西班牙语语音测试失败: ' + error.message);
              button.setButtonText('Probar');
              button.setDisabled(false);
            }
          });
      });





    // Playback speed
    new obsidian.Setting(containerEl)
      .setName('播放速度')
      .setDesc('调整播放速度倍数')
      .addSlider(slider => {
        slider.setLimits(0.5, 2.0, 0.1);
        slider.setValue(this.plugin.settings.playbackSpeed);
        slider.onChange(async (value) => {
          this.plugin.settings.playbackSpeed = value;
          await this.plugin.saveSettings();
        });
        slider.setDynamicTooltip();
        slider.showTooltip();
      });

    // Show notices
    new obsidian.Setting(containerEl)
      .setName('显示通知')
      .setDesc('开启/关闭处理状态和错误通知')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.showNotices);
        toggle.onChange(async (value) => {
          this.plugin.settings.showNotices = value;
          await this.plugin.saveSettings();
        });
      });
      
    containerEl.createEl('h3', { text: '文件管理设置' });
      
    // 输出文件夹设置
    new obsidian.Setting(containerEl)
      .setName('音频文件输出文件夹')
      .setDesc('设置生成的音频文件保存的文件夹名称（相对于库根目录）')
      .addText(text => {
        text.setValue(this.plugin.settings.outputFolder);
        text.onChange(async (value) => {
          this.plugin.settings.outputFolder = value || 'Note Narration Audio';
          await this.plugin.saveSettings();
        });
        text.setPlaceholder('Note Narration Audio');
      });

    // Status bar button
    new obsidian.Setting(containerEl)
      .setName('显示状态栏按钮')
      .setDesc('在状态栏显示播放按钮')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.showStatusBarButton);
        toggle.onChange(async (value) => {
          this.plugin.settings.showStatusBarButton = value;
          await this.plugin.saveSettings();
          if (value) {
            this.plugin.initializeStatusBar();
          } else {
            this.plugin.removeStatusBarButton();
          }
        });
      });

    // 右键菜单功能设置
    containerEl.createEl('h3', { text: '右键菜单功能' });

    // 右键菜单语音朗读
    new obsidian.Setting(containerEl)
      .setName('启用右键菜单语音朗读')
      .setDesc('在编辑器右键菜单中添加语音朗读功能')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enableContextMenuTTS);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableContextMenuTTS = value;
          await this.plugin.saveSettings();
          new obsidian.Notice(`右键菜单语音朗读 ${value ? '已启用' : '已禁用'}`);
        });
      });

    // 右键菜单MP3生成
    new obsidian.Setting(containerEl)
      .setName('启用右键菜单MP3生成')
      .setDesc('在编辑器右键菜单中添加MP3生成功能（仅桌面版）')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enableContextMenuMP3);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableContextMenuMP3 = value;
          await this.plugin.saveSettings();
          new obsidian.Notice(`右键菜单MP3生成 ${value ? '已启用' : '已禁用'}`);
        });
      });

    // 内嵌音频进度条
    new obsidian.Setting(containerEl)
      .setName('启用生成音频文件')
      .setDesc('允许将选中文本生成MP3文件并插入引用')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enableInlineProgressBar);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableInlineProgressBar = value;
          await this.plugin.saveSettings();
          new obsidian.Notice(`生成音频文件功能 ${value ? '已启用' : '已禁用'}`);
        });
      });
  }
}

// Main plugin class
class EdgeTTSPlugin extends obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.tts = null;
    this.statusBarItem = null;
  }

  async onload() {
    console.log('🔥 Loading Local Edge TTS Plugin - 修复版本 v2.0');
    console.log('🔥 自动语言检测已启用');

    await this.loadSettings();
    
    // Initialize TTS with plugin directory
    const pluginDir = this.app.vault.adapter.basePath + '/.obsidian/plugins/local-edge-tts';
    this.tts = new EdgeTTS(this.settings, pluginDir);
    
    // Load voices from Python script
    try {
      await this.tts.loadVoices();
      console.log('Loaded voice options from Python script');
    } catch (error) {
      console.warn('Failed to load voices, using defaults:', error);
    }

    // Add settings tab
    this.addSettingTab(new EdgeTTSPluginSettingTab(this.app, this));

    // Add ribbon icon
    this.addRibbonIcon('audio-file', 'TTS 朗读', () => {
      this.readCurrentNote();
    });

    // Add status bar item if enabled
    if (this.settings.showStatusBarButton) {
      this.initializeStatusBar();
    }

    // Add commands
    this.addCommand({
      id: 'read-note-aloud',
      name: '朗读笔记',
      editorCallback: (editor, view) => {
        this.readNoteAloud(editor, view);
      }
    });

    this.addCommand({
      id: 'read-selected-text',
      name: '朗读选中文本',
      editorCallback: (editor, view) => {
        const selectedText = editor.getSelection();
        if (selectedText.trim()) {
          this.startPlayback(selectedText);
        } else {
          if (this.settings.showNotices) {
            new obsidian.Notice('没有选中文本');
          }
        }
      }
    });

    this.addCommand({
      id: 'stop-tts-playback',
      name: '停止朗读',
      callback: () => {
        this.stopPlayback();
      }
    });

    // 注册右键菜单事件
    this.registerContextMenuEvents();

    console.log('Local Edge TTS Plugin loaded successfully');
  }

  initializeStatusBar() {
    if (!this.statusBarItem) {
      this.statusBarItem = this.addStatusBarItem();
      this.statusBarItem.setText('🔊 TTS');
      this.statusBarItem.addClass('mod-clickable');
      this.statusBarItem.onclick = () => {
        this.readCurrentNote();
      };
    }
  }

  removeStatusBarButton() {
    if (this.statusBarItem) {
      this.statusBarItem.remove();
      this.statusBarItem = null;
    }
  }

  // 注册右键菜单事件
  registerContextMenuEvents() {
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        // 添加语音朗读选项
        if (this.settings.enableContextMenuTTS) {
          menu.addItem((item) => {
            item
              .setTitle('语音朗读')
              .setIcon('audio-lines')
              .onClick(async () => {
                const selectedText = editor.getSelection();
                if (selectedText.trim()) {
                  await this.startPlayback(selectedText);
                } else {
                  await this.readNoteAloud(editor, view);
                }
              });
          });
        }

        // 添加MP3生成选项（仅桌面版）
        if (this.settings.enableContextMenuMP3 && !obsidian.Platform.isMobile) {
          menu.addItem((item) => {
            item
              .setTitle('生成MP3')
              .setIcon('microphone')
              .onClick(async () => {
                await this.generateMP3(editor, view);
              });
          });
        }

        // 添加插入进度条选项
        if (this.settings.enableInlineProgressBar) {
          menu.addItem((item) => {
            item
              .setTitle('生成音频文件')
              .setIcon('audio-waveform')
              .onClick(async () => {
                await this.insertProgressBar(editor);
              });
          });
        }
      })
    );
  }

  async readCurrentNote() {
    const activeView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
    if (activeView && activeView.editor) {
      await this.readNoteAloud(activeView.editor, activeView);
    } else {
      if (this.settings.showNotices) {
        new obsidian.Notice('没有找到活动笔记');
      }
    }
  }

  async readNoteAloud(editor, view) {
    const selectedText = editor.getSelection() || editor.getValue();
    
    if (!selectedText.trim()) {
      if (this.settings.showNotices) {
        new obsidian.Notice('没有可朗读的文本');
      }
      return;
    }

    await this.startPlayback(selectedText);
  }

  async startPlayback(text) {
    try {
      if (this.settings.showNotices) {
        new obsidian.Notice('开始朗读...');
      }
      
      // Update status bar
      if (this.statusBarItem) {
        this.statusBarItem.setText('🔊 朗读中...');
      }

      await this.tts.speak(text);
      
      // Update status bar when finished
      if (this.statusBarItem) {
        this.statusBarItem.setText('🔊 TTS');
      }
      
      if (this.settings.showNotices) {
        new obsidian.Notice('朗读完成');
      }
    } catch (error) {
      console.error('TTS playback error:', error);
      
      if (this.statusBarItem) {
        this.statusBarItem.setText('🔊 TTS');
      }
      
      if (this.settings.showNotices) {
        // 创建可复制的错误通知
        this.showCopyableError('朗读失败', error.message || error.toString());
      }
    }
  }

  stopPlayback() {
    this.tts.stop();
    
    if (this.statusBarItem) {
      this.statusBarItem.setText('🔊 TTS');
    }
    
    if (this.settings.showNotices) {
      new obsidian.Notice('朗读已停止');
    }
  }

  // 生成MP3文件
  async generateMP3(editor, view) {
    if (obsidian.Platform.isMobile) {
      if (this.settings.showNotices) {
        new obsidian.Notice('移动端不支持MP3生成功能');
      }
      return;
    }

    let selectedText = '';
    if (editor && view) {
      selectedText = editor.getSelection() || editor.getValue();
    }

    if (!selectedText.trim()) {
      if (this.settings.showNotices) {
        new obsidian.Notice('没有可生成MP3的文本');
      }
      return;
    }

    try {
      if (this.settings.showNotices) {
        new obsidian.Notice('开始生成MP3...');
      }

      // 过滤文本
      const filteredText = filterMarkdown(selectedText);
      
      // 检测语言并选择语音
      const detectedLanguage = detectLanguage(filteredText);
      const selectedVoice = this.settings.voiceSettings[detectedLanguage] || this.settings.selectedVoice;

      // 生成MP3文件
      const result = await this.tts.generateMP3(filteredText, selectedVoice);
      
      if (result.success) {
        if (this.settings.showNotices) {
          new obsidian.Notice(`MP3文件已生成: ${result.filename}`);
        }
      } else {
        throw new Error(result.error || 'MP3生成失败');
      }
    } catch (error) {
      console.error('MP3 generation error:', error);
      if (this.settings.showNotices) {
        this.showCopyableError('MP3生成失败', error.message || error.toString());
      }
    }
  }

  // 插入音频进度条（生成MP3并插入引用）
  async insertProgressBar(editor) {
    if (!this.settings.enableInlineProgressBar) {
      if (this.settings.showNotices) {
        new obsidian.Notice('内嵌音频进度条功能未启用');
      }
      return;
    }

    // 获取选中的文本
    const selectedText = editor.getSelection();
    if (!selectedText.trim()) {
      if (this.settings.showNotices) {
        new obsidian.Notice('请先选择要转换为音频的文本');
      }
      return;
    }

    try {
      if (this.settings.showNotices) {
        new obsidian.Notice('正在生成音频文件...');
      }

      // 过滤Markdown文本
      const filteredText = filterMarkdown(selectedText);
      
      // 检测语言并选择合适的语音
      const detectedLanguage = this.tts.detectLanguage(filteredText);
      const selectedVoice = this.tts.selectVoiceForLanguage(detectedLanguage);
      
      console.log(`[插入音频进度条] 检测到语言: ${detectedLanguage}, 选择语音: ${selectedVoice}`);
      
      // 确保输出文件夹存在
      const outputFolderName = this.settings.outputFolder || 'Note Narration Audio';
      const vaultPath = this.app.vault.adapter.basePath;
      const outputDir = path.join(vaultPath, outputFolderName);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 生成文件名（基于文本内容前10个字符 + 时间戳）
      const textPrefix = filteredText
        .substring(0, 10)
        .replace(/[^\w\u4e00-\u9fff]/g, '_')  // 保留中英文字符，其他替换为下划线
        .replace(/_+/g, '_')  // 合并多个下划线
        .replace(/^_|_$/g, '');  // 去除首尾下划线
      
      const timestamp = Date.now();
      const filename = `${textPrefix || 'audio'}_${timestamp}.mp3`;
      const outputPath = path.join(outputDir, filename);
      
      // 生成MP3文件
      const result = await this.tts.generateMP3(filteredText, selectedVoice, outputPath);
      
      if (result.success) {
        // 生成相对于vault根目录的路径
        const relativePath = path.join(outputFolderName, filename).replace(/\\/g, '/');
        
        // 在光标位置插入音频文件引用
        const cursor = editor.getCursor();
        const audioReference = `![[${relativePath}]]`;
        
        // 如果当前行不为空，先换行
        const currentLine = editor.getLine(cursor.line);
        const insertText = currentLine.trim() ? `\n${audioReference}` : audioReference;
        
        editor.replaceRange(insertText, cursor);
        
        if (this.settings.showNotices) {
          new obsidian.Notice(`音频文件已生成并插入: ${filename}`);
        }
        
        console.log(`[插入音频进度条] 成功生成音频文件: ${outputPath}`);
        console.log(`[插入音频进度条] 插入的引用: ${audioReference}`);
        
      } else {
        throw new Error(result.error || 'MP3生成失败');
      }
      
    } catch (error) {
      console.error('插入音频进度条错误:', error);
      if (this.settings.showNotices) {
        this.showCopyableError('插入音频进度条失败', error.message || error.toString());
      }
    }
  }

  // 创建内嵌进度条
  createInlineProgressBar(containerEl, editor) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'inline-tts-progress-bar';
    progressContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--background-secondary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      margin: 4px 0;
      font-size: 12px;
      color: var(--text-normal);
      transition: all 0.2s ease;
    `;

    // 播放/暂停按钮
    const playPauseButton = document.createElement('button');
    playPauseButton.innerHTML = '▶';
    playPauseButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      color: var(--text-normal);
      font-size: 14px;
    `;

    // 停止按钮
    const stopButton = document.createElement('button');
    stopButton.innerHTML = '⏹';
    stopButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      color: var(--text-normal);
      font-size: 14px;
    `;

    // 进度条
    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.min = '0';
    progressBar.max = '100';
    progressBar.value = '0';
    progressBar.style.cssText = `
      flex: 1;
      height: 6px;
      background: var(--background-modifier-border);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      margin: 0 4px;
    `;

    // 时间显示
    const timeDisplay = document.createElement('span');
    timeDisplay.textContent = '0:00 / 0:00';
    timeDisplay.style.cssText = `
      min-width: 70px;
      text-align: right;
      color: var(--text-muted);
      font-size: 11px;
    `;

    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '✕';
    deleteButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      color: var(--text-muted);
      font-size: 12px;
    `;

    // 按钮事件
    playPauseButton.addEventListener('click', () => {
      const selectedText = editor.getSelection() || editor.getValue();
      if (selectedText.trim()) {
        this.startPlayback(selectedText);
        playPauseButton.innerHTML = '⏸';
      }
    });

    stopButton.addEventListener('click', () => {
      this.stopPlayback();
      playPauseButton.innerHTML = '▶';
    });

    deleteButton.addEventListener('click', () => {
      if (progressContainer.parentNode) {
        progressContainer.parentNode.removeChild(progressContainer);
      }
    });

    progressContainer.appendChild(playPauseButton);
    progressContainer.appendChild(stopButton);
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(timeDisplay);
    progressContainer.appendChild(deleteButton);

    containerEl.appendChild(progressContainer);
    return progressContainer;
  }

  // 显示可复制的错误信息
  showCopyableError(title, errorMessage) {
    // 创建一个模态对话框来显示错误信息
    const modal = new obsidian.Modal(this.app);
    modal.titleEl.setText(title);
    
    const contentEl = modal.contentEl;
    contentEl.empty();
    
    // 添加错误信息容器
    const errorContainer = contentEl.createDiv({
      cls: 'tts-error-container'
    });
    
    const errorTitle = errorContainer.createEl('h3', {
      text: '错误详情:'
    });
    
    // 创建可选择的文本区域
    const errorTextArea = errorContainer.createEl('textarea', {
      cls: 'tts-error-text',
      attr: {
        readonly: true,
        rows: 10,
        style: 'width: 100%; font-family: monospace; font-size: 12px; resize: vertical;'
      }
    });
    errorTextArea.value = errorMessage;
    
    // 添加按钮容器
    const buttonContainer = contentEl.createDiv({
      cls: 'tts-error-buttons',
      attr: {
        style: 'margin-top: 10px; text-align: right;'
      }
    });
    
    // 复制按钮
    const copyButton = buttonContainer.createEl('button', {
      text: '复制错误信息',
      cls: 'mod-cta',
      attr: {
        style: 'margin-right: 10px;'
      }
    });
    
    copyButton.onclick = () => {
      navigator.clipboard.writeText(errorMessage).then(() => {
        new obsidian.Notice('错误信息已复制到剪贴板');
        modal.close();
      }).catch(() => {
        // 如果现代剪贴板API不可用，使用传统方法
        errorTextArea.select();
        document.execCommand('copy');
        new obsidian.Notice('错误信息已复制到剪贴板');
        modal.close();
      });
    };
    
    // 关闭按钮
    const closeButton = buttonContainer.createEl('button', {
      text: '关闭'
    });
    
    closeButton.onclick = () => {
      modal.close();
    };
    
    // 自动选择文本以便快速复制
    setTimeout(() => {
      errorTextArea.select();
      errorTextArea.focus();
    }, 100);
    
    modal.open();
  }

  async loadSettings() {
    const loadedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    
    // 向后兼容性：如果没有voiceSettings，从旧设置迁移
    if (!this.settings.voiceSettings) {
      this.settings.voiceSettings = {
        chinese: 'zh-CN-XiaoxiaoNeural',
        english: 'en-US-AriaNeural',
        spanish: 'es-ES-ElviraNeural'
      };
      
      // 如果有旧的selectedVoice设置，尝试映射到新结构
      if (this.settings.selectedVoice) {
        const voiceLanguage = this.getVoiceLanguage(this.settings.selectedVoice);
        switch (voiceLanguage) {
          case 'zh':
            this.settings.voiceSettings.chinese = this.settings.selectedVoice;
            break;
          case 'en':
            this.settings.voiceSettings.english = this.settings.selectedVoice;
            break;
          case 'es':
            this.settings.voiceSettings.spanish = this.settings.selectedVoice;
            break;
        }
      }
      
      // 保存迁移后的设置
      await this.saveSettings();
    }
  }
  
  // 获取语音语言的辅助函数（用于设置迁移）
  getVoiceLanguage(voiceName) {
    if (voiceName.startsWith('zh-')) {
      return 'zh';
    } else if (voiceName.startsWith('es-')) {
      return 'es';
    } else if (voiceName.startsWith('en-')) {
      return 'en';
    }
    return 'en'; // 默认英语
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    if (this.tts) {
      this.tts.updateSettings(this.settings);
    }

    // Update UI elements based on settings
    if (this.settings.showStatusBarButton && !this.statusBarItem) {
      this.initializeStatusBar();
    } else if (!this.settings.showStatusBarButton && this.statusBarItem) {
      this.removeStatusBarButton();
    }
  }

  onunload() {
    console.log('Unloading Local Edge TTS Plugin');
    this.stopPlayback();
    this.removeStatusBarButton();
  }
}

module.exports = EdgeTTSPlugin;

module.exports = EdgeTTSPlugin;
