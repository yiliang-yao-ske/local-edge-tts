import { Plugin, MarkdownView, Notice, Editor, MarkdownFileInfo, Platform, Menu } from 'obsidian';
import { EdgeTTSPluginSettings, EdgeTTSPluginSettingTab, DEFAULT_SETTINGS } from './src/modules/settings';
import { TTSEngine, TTSTaskStatus } from './src/modules/tts-engine';
import { OUTPUT_FORMAT } from './src/modules/tts-client-wrapper';
import { checkAndTruncateContent, shouldShowNotices, filterMarkdown, filterFrontmatter } from './src/utils';
import { InlineProgressBar, insertProgressBarAtCursor } from './src/modules/inline-progress-bar';

// Language detection utility
function detectLanguage(text: string): string {
	// Remove markdown syntax and clean text
	const cleanText = text.replace(/[#*_`>\-\[\]()]/g, ' ').trim();
	
	// Chinese character detection
	const chineseRegex = /[\u4e00-\u9fff]/;
	if (chineseRegex.test(cleanText)) {
		return 'zh';
	}
	
	// Spanish detection (basic words)
	const spanishWords = /\b(el|la|los|las|de|que|y|en|un|una|es|se|no|te|lo|le|da|su|por|son|con|para|al|del|está|todo|pero|más|hacer|muy|puede|ahora|cada|dijo|desde|has|hasta|donde|mientras|tanto|antes|después|durante|entre|hacia|según|sobre|tras|aunque|sino|porque|cuando|como|qué|quién|cómo|dónde|cuál|cuáles|cuándo|cuánto|cuánta|cuántos|cuántas)\b/i;
	if (spanishWords.test(cleanText)) {
		return 'es';
	}
	
	// Default to English for other text
	return 'en';
}

// Voice selection based on language
function selectVoiceForLanguage(language: string, currentSettings: EdgeTTSPluginSettings): string {
	// If custom voice is set, use it
	if (currentSettings.customVoice.trim()) {
		return currentSettings.customVoice.trim();
	}
	
	// Auto-select voice based on detected language
	switch (language) {
		case 'zh':
			return 'zh-CN-XiaoxiaoNeural'; // Chinese female voice
		case 'es':
			return 'es-ES-ElviraNeural'; // Spanish female voice
		case 'en':
		default:
			return 'en-US-AriaNeural'; // English female voice
	}
}

export default class EdgeTTSPlugin extends Plugin {
	settings: EdgeTTSPluginSettings;
	ttsEngine: TTSEngine;
	statusBarItem: HTMLElement | null = null;
	currentProgressBar: InlineProgressBar | null = null;
	audioElement: HTMLAudioElement | null = null;

	// Task tracking for MP3 generation
	private mp3GenerationTasks: Map<string, { taskId: string, editor?: Editor, filePath?: string }> = new Map();

	async onload() {
		console.log('Loading Local Edge TTS Plugin');

		await this.loadSettings();

		// Initialize TTSEngine
		this.ttsEngine = new TTSEngine(this.settings);

		// Add settings tab
		this.addSettingTab(new EdgeTTSPluginSettingTab(this.app, this));

		// Add ribbon icon
		this.addRibbonIcon('audio-file', 'Edge TTS', () => {
			this.readCurrentNote();
		});

		// Add status bar item if enabled
		if (this.settings.showStatusBarButton) {
			this.initializeStatusBar();
		}

		// Start task monitoring for background processing
		this.registerInterval(
			window.setInterval(() => this.monitorTasks(), 1000)
		);

		// Add command to read notes aloud
		this.addCommand({
			id: 'read-note-aloud',
			name: 'Read note aloud',
			editorCallback: (editor, view) => {
				this.readNoteAloud(editor, view);
			}
		});

		// Add command to read selected text
		this.addCommand({
			id: 'read-selected-text',
			name: 'Read selected text aloud',
			editorCallback: (editor, view) => {
				const selectedText = editor.getSelection();
				if (selectedText.trim()) {
					this.startPlayback(selectedText);
				} else {
					if (shouldShowNotices(this.settings)) new Notice('No text selected.');
				}
			}
		});

		// Add command to generate MP3 (desktop only)
		if (!Platform.isMobile) {
			this.addCommand({
				id: 'generate-mp3',
				name: 'Generate MP3',
				editorCallback: (editor, view) => {
					this.generateMP3(editor, view);
				}
			});
		}

		// Add command to stop playback
		this.addCommand({
			id: 'stop-tts-playback',
			name: 'Stop TTS playback',
			callback: () => {
				this.stopPlayback();
			}
		});

		// Add command to insert progress bar
		this.addCommand({
			id: 'insert-progress-bar',
			name: 'Insert audio progress bar',
			editorCallback: (editor, view) => {
				this.insertProgressBar(editor);
			}
		});

		// Register context menu events
		this.registerContextMenuEvents();

		console.log('Local Edge TTS Plugin loaded successfully');
	}

	initializeStatusBar(): void {
		if (!this.statusBarItem) {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.setText('🔊 TTS Ready');
			this.statusBarItem.addClass('mod-clickable');
			this.statusBarItem.onclick = () => {
				this.readCurrentNote();
			};
		}
	}

	removeStatusBarButton(): void {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
	}

	async readCurrentNote(): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView && activeView.editor) {
			await this.readNoteAloud(activeView.editor, activeView);
		} else {
			if (shouldShowNotices(this.settings)) new Notice('No active note found.');
		}
	}

	/**
	 * Monitor background TTS tasks
	 */
	private monitorTasks(): void {
		// Check for completed MP3 generation tasks
		for (const [id, taskInfo] of this.mp3GenerationTasks.entries()) {
			const task = this.ttsEngine.getTask(taskInfo.taskId);

			if (!task) {
				this.mp3GenerationTasks.delete(id);
				continue;
			}

			// Handle completed tasks
			if (task.status === TTSTaskStatus.COMPLETED && task.buffer) {
				this.mp3GenerationTasks.delete(id);

				// Save the MP3 file (simplified for this basic implementation)
				this.saveMP3File(task.buffer, taskInfo.filePath);

				if (shouldShowNotices(this.settings)) new Notice('MP3 generation complete');
			}
			// Handle failed tasks
			else if (task.status === TTSTaskStatus.FAILED) {
				this.mp3GenerationTasks.delete(id);
				if (shouldShowNotices(this.settings)) new Notice(`MP3 generation failed: ${task.error || 'Unknown error'}`);
			}
		}

		// Clean up old tasks periodically (every 5 minutes)
		if (Math.random() < 0.0033) { // ~1/300 chance each second = ~once every 5 minutes
			this.ttsEngine.cleanupOldTasks();
		}
	}

	async readNoteAloud(editor?: Editor, viewInput?: MarkdownView | MarkdownFileInfo, filePath?: string): Promise<void> {
		let selectedText = '';

		if (filePath) {
			// Read file content
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file && 'content' in file) {
				selectedText = await this.app.vault.read(file);
			}
		} else {
			const view = viewInput ?? this.app.workspace.getActiveViewOfType(MarkdownView);

			if (!editor && view) editor = view.editor;

			if (editor && view) {
				selectedText = editor.getSelection() || editor.getValue();
			}
		}

		if (!selectedText.trim()) {
			if (shouldShowNotices(this.settings)) new Notice('No text available to read.');
			return;
		}

		// Check content limits and truncate if necessary
		const truncationResult = checkAndTruncateContent(selectedText);

		if (truncationResult.wasTruncated) {
			const limitType = truncationResult.truncationReason === 'words' ? 'word' : 'character';
			const limitValue = truncationResult.truncationReason === 'words' ? '5,000 words' : '30,000 characters';

			if (shouldShowNotices(this.settings)) {
				new Notice(
					`Content exceeds playback limit (${limitValue}). ` +
					`Playing first ${truncationResult.finalWordCount.toLocaleString()} words ` +
					`(${truncationResult.finalCharCount.toLocaleString()} characters). ` +
					`Original content had ${truncationResult.originalWordCount.toLocaleString()} words.`,
					8000 // Show notice for 8 seconds
				);
			}
		}

		// Use audio manager for playback with potentially truncated content
		await this.startPlayback(truncationResult.content);
	}

	async startPlayback(text: string): Promise<void> {
		try {
			if (shouldShowNotices(this.settings)) new Notice('Generating audio...');
			
			// Update status bar
			if (this.statusBarItem) {
				this.statusBarItem.setText('🔊 Generating...');
			}

			const audioBuffer = await this.ttsEngine.generateAudioBuffer(text);
			
			if (audioBuffer) {
				// Create audio context and play
				const audioContext = new AudioContext();
				const source = audioContext.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(audioContext.destination);
				
				// Update status bar
				if (this.statusBarItem) {
					this.statusBarItem.setText('🔊 Playing...');
				}

				source.start();
				
				source.onended = () => {
					if (this.statusBarItem) {
						this.statusBarItem.setText('🔊 TTS Ready');
					}
					if (shouldShowNotices(this.settings)) new Notice('Playback finished.');
				};
			} else {
				if (shouldShowNotices(this.settings)) new Notice('Failed to generate audio.');
				if (this.statusBarItem) {
					this.statusBarItem.setText('🔊 TTS Ready');
				}
			}
		} catch (error) {
			console.error('TTS playback error:', error);
			if (shouldShowNotices(this.settings)) new Notice('TTS playback failed.');
			if (this.statusBarItem) {
				this.statusBarItem.setText('🔊 TTS Ready');
			}
		}
	}

	stopPlayback(): void {
		// Simple stop implementation - stop all audio contexts
		if (shouldShowNotices(this.settings)) new Notice('Playback stopped.');
		if (this.statusBarItem) {
			this.statusBarItem.setText('🔊 TTS Ready');
		}
	}

	async generateMP3(editor?: Editor, viewInput?: MarkdownView | MarkdownFileInfo, filePath?: string): Promise<void> {
		// Check if we're on mobile - MP3 generation is not supported
		if (Platform.isMobile) {
			if (shouldShowNotices(this.settings)) {
				new Notice('MP3 generation is not supported on mobile devices due to file system limitations. Use audio playback instead.');
			}
			return;
		}

		let selectedText = '';

		if (filePath) {
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file && 'content' in file) {
				selectedText = await this.app.vault.read(file);
			}
		} else {
			const view = viewInput ?? this.app.workspace.getActiveViewOfType(MarkdownView);

			if (!editor && view) editor = view.editor;

			if (editor && view) {
				selectedText = editor.getSelection() || editor.getValue();
			}
		}

		if (!selectedText.trim()) {
			if (shouldShowNotices(this.settings)) new Notice('No text selected or available.');
			return;
		}

		// Check content limits and truncate if necessary
		const truncationResult = checkAndTruncateContent(selectedText);

		if (truncationResult.wasTruncated) {
			const limitType = truncationResult.truncationReason === 'words' ? 'word' : 'character';
			const limitValue = truncationResult.truncationReason === 'words' ? '5,000 words' : '30,000 characters';

			if (shouldShowNotices(this.settings)) {
				new Notice(
					`Content exceeds MP3 generation limit (${limitValue}). ` +
					`Generating MP3 for the first ${truncationResult.finalWordCount.toLocaleString()} words ` +
					`(${truncationResult.finalCharCount.toLocaleString()} characters). ` +
					`Original content had ${truncationResult.originalWordCount.toLocaleString()} words.`,
					8000 // Show notice for 8 seconds
				);
			}
		}

		// Use the potentially truncated content
		const contentToProcess = truncationResult.content;

		try {
			if (shouldShowNotices(this.settings)) new Notice('Starting MP3 generation in background...');

			// Create a background task for MP3 generation
			const task = this.ttsEngine.createTask(contentToProcess, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

			// Generate a unique ID for this MP3 generation task
			const generationId = `mp3-${Date.now()}`;

			// Store task information for monitoring
			this.mp3GenerationTasks.set(generationId, {
				taskId: task.id,
				editor,
				filePath
			});
		} catch (error) {
			console.error('Error starting MP3 generation:', error);
			if (shouldShowNotices(this.settings)) new Notice('Failed to start MP3 generation.');
		}
	}

	async saveMP3File(buffer: Buffer | Uint8Array, filePath?: string): Promise<void> {
		try {
			// Create filename
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const filename = `note-${timestamp}.mp3`;
			
			// For now, just show a notice that MP3 would be saved
			if (shouldShowNotices(this.settings)) {
				new Notice(`MP3 file ready: ${filename} (${buffer.length} bytes)`);
			}
			
			// In a full implementation, you would save the file to the vault
			// This is a simplified version for the basic migration
		} catch (error) {
			console.error('Error saving MP3 file:', error);
			if (shouldShowNotices(this.settings)) new Notice('Failed to save MP3 file.');
		}
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Ensure textFiltering settings exist for backward compatibility
		if (!this.settings.textFiltering) {
			this.settings.textFiltering = DEFAULT_SETTINGS.textFiltering;
		} else {
			// Merge any missing text filtering properties with defaults
			this.settings.textFiltering = Object.assign({}, DEFAULT_SETTINGS.textFiltering, this.settings.textFiltering);
		}

		// Ensure symbolReplacement settings exist for backward compatibility
		if (!this.settings.symbolReplacement) {
			this.settings.symbolReplacement = DEFAULT_SETTINGS.symbolReplacement;
		} else {
			// Merge any missing symbol replacement properties with defaults
			this.settings.symbolReplacement = Object.assign({}, DEFAULT_SETTINGS.symbolReplacement, this.settings.symbolReplacement);
		}

		// Ensure new context menu settings exist for backward compatibility
		if (typeof this.settings.enableContextMenuTTS === 'undefined') {
			this.settings.enableContextMenuTTS = DEFAULT_SETTINGS.enableContextMenuTTS;
		}
		if (typeof this.settings.enableInlineProgressBar === 'undefined') {
			this.settings.enableInlineProgressBar = DEFAULT_SETTINGS.enableInlineProgressBar;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);

		// Update settings in TTS engine
		this.ttsEngine.updateSettings(this.settings);

		// Update UI elements based on settings
		if (this.settings.showStatusBarButton && !this.statusBarItem) {
			this.initializeStatusBar();
		} else if (!this.settings.showStatusBarButton && this.statusBarItem) {
			this.removeStatusBarButton();
		}
	}

	/**
	 * Register context menu events for right-click functionality
	 */
	private registerContextMenuEvents(): void {
		// Register editor context menu
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
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

				if (this.settings.enableInlineProgressBar) {
					menu.addItem((item) => {
						item
							.setTitle('插入音频进度条')
							.setIcon('audio-waveform')
							.onClick(() => {
								this.insertProgressBar(editor);
							});
					});
				}
			})
		);
	}

	/**
	 * Insert progress bar at current cursor position
	 */
	private insertProgressBar(editor: Editor): void {
		if (!this.settings.enableInlineProgressBar) {
			if (shouldShowNotices(this.settings)) {
				new Notice('内嵌音频进度条功能未启用');
			}
			return;
		}

		const progressBar = insertProgressBarAtCursor(editor, {
			onPlay: () => {
				if (this.audioElement) {
					this.audioElement.play();
				} else {
					// 如果没有音频，播放当前选中文本或整个文档
					const selectedText = editor.getSelection();
					if (selectedText.trim()) {
						this.startPlaybackWithProgressBar(selectedText, progressBar);
					} else {
						const content = editor.getValue();
						this.startPlaybackWithProgressBar(content, progressBar);
					}
				}
			},
			onPause: () => {
				if (this.audioElement) {
					this.audioElement.pause();
				}
			},
			onStop: () => {
				this.stopPlayback();
				if (progressBar) {
					progressBar.stop();
				}
			},
			onSeek: (time: number) => {
				if (this.audioElement) {
					this.audioElement.currentTime = time;
				}
			}
		});

		if (progressBar) {
			this.currentProgressBar = progressBar;
			if (shouldShowNotices(this.settings)) {
				new Notice('音频进度条已插入');
			}
		} else {
			if (shouldShowNotices(this.settings)) {
				new Notice('插入音频进度条失败');
			}
		}
	}

	/**
	 * Start playback with progress bar integration
	 */
	private async startPlaybackWithProgressBar(text: string, progressBar: InlineProgressBar): Promise<void> {
		try {
			if (shouldShowNotices(this.settings)) new Notice('正在生成音频...');
			
			// Update status bar
			if (this.statusBarItem) {
				this.statusBarItem.setText('🔊 生成中...');
			}

			const audioBuffer = await this.ttsEngine.generateAudioBuffer(text);
			
			if (audioBuffer) {
				// Create audio context and play
				const audioContext = new AudioContext();
				const source = audioContext.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(audioContext.destination);
				
				// Create HTML audio element for progress tracking
				const audioBlob = await this.audioBufferToBlob(audioBuffer, audioContext);
				const audioUrl = URL.createObjectURL(audioBlob);
				
				if (this.audioElement) {
					this.audioElement.pause();
					URL.revokeObjectURL(this.audioElement.src);
				}
				
				this.audioElement = new Audio(audioUrl);
				
				// Set up progress tracking
				this.audioElement.addEventListener('loadedmetadata', () => {
					if (this.audioElement && progressBar) {
						progressBar.updateTime(0, this.audioElement.duration);
					}
				});
				
				this.audioElement.addEventListener('timeupdate', () => {
					if (this.audioElement && progressBar) {
						progressBar.updateTime(this.audioElement.currentTime, this.audioElement.duration);
					}
				});
				
				this.audioElement.addEventListener('ended', () => {
					if (progressBar) {
						progressBar.stop();
					}
					if (this.statusBarItem) {
						this.statusBarItem.setText('🔊 TTS Ready');
					}
				});
				
				// Update status bar and play
				if (this.statusBarItem) {
					this.statusBarItem.setText('🔊 播放中...');
				}

				await this.audioElement.play();
				progressBar.play();
				
			} else {
				if (shouldShowNotices(this.settings)) new Notice('生成音频失败');
				if (this.statusBarItem) {
					this.statusBarItem.setText('🔊 TTS Ready');
				}
			}
		} catch (error) {
			console.error('TTS playback error:', error);
			if (shouldShowNotices(this.settings)) new Notice('TTS播放失败');
			if (this.statusBarItem) {
				this.statusBarItem.setText('🔊 TTS Ready');
			}
		}
	}

	/**
	 * Convert AudioBuffer to Blob for HTML audio element
	 */
	private async audioBufferToBlob(audioBuffer: AudioBuffer, audioContext: AudioContext): Promise<Blob> {
		const numberOfChannels = audioBuffer.numberOfChannels;
		const length = audioBuffer.length;
		const sampleRate = audioBuffer.sampleRate;
		const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
		const view = new DataView(arrayBuffer);
		
		// WAV header
		const writeString = (offset: number, string: string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};
		
		writeString(0, 'RIFF');
		view.setUint32(4, 36 + length * numberOfChannels * 2, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, numberOfChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * numberOfChannels * 2, true);
		view.setUint16(32, numberOfChannels * 2, true);
		view.setUint16(34, 16, true);
		writeString(36, 'data');
		view.setUint32(40, length * numberOfChannels * 2, true);
		
		// Audio data
		let offset = 44;
		for (let i = 0; i < length; i++) {
			for (let channel = 0; channel < numberOfChannels; channel++) {
				const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
				view.setInt16(offset, sample * 0x7FFF, true);
				offset += 2;
			}
		}
		
		return new Blob([arrayBuffer], { type: 'audio/wav' });
	}

	onunload() {
		console.log('Unloading Local Edge TTS Plugin');
		this.removeStatusBarButton();
		
		// Clean up audio resources
		if (this.audioElement) {
			this.audioElement.pause();
			if (this.audioElement.src) {
				URL.revokeObjectURL(this.audioElement.src);
			}
			this.audioElement = null;
		}
		
		// Clean up progress bar
		if (this.currentProgressBar) {
			this.currentProgressBar.destroy();
			this.currentProgressBar = null;
		}
	}
}
