import { Editor, EditorPosition } from 'obsidian';

/**
 * 内嵌音频进度条组件
 * 用于在编辑器中显示音频播放进度
 */
export class InlineProgressBar {
  private container: HTMLElement;
  private progressBar: HTMLElement;
  private timeDisplay: HTMLElement;
  private playPauseButton: HTMLElement;
  private stopButton: HTMLElement;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private audio: HTMLAudioElement | null = null;
  private updateInterval: number | null = null;

  private onPlay?: () => void;
  private onPause?: () => void;
  private onStop?: () => void;
  private onSeek?: (time: number) => void;

  constructor(
    containerEl: HTMLElement,
    callbacks?: {
      onPlay?: () => void;
      onPause?: () => void;
      onStop?: () => void;
      onSeek?: (time: number) => void;
    }
  ) {
    this.onPlay = callbacks?.onPlay;
    this.onPause = callbacks?.onPause;
    this.onStop = callbacks?.onStop;
    this.onSeek = callbacks?.onSeek;

    this.container = this.createProgressBarElement();
    containerEl.appendChild(this.container);
    this.bindEvents();
  }

  private createProgressBarElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'inline-tts-progress-bar';
    container.style.cssText = `
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
    `;

    // 播放/暂停按钮
    this.playPauseButton = document.createElement('button');
    this.playPauseButton.innerHTML = '▶';
    this.playPauseButton.className = 'inline-tts-play-btn';
    this.playPauseButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--text-normal);
      font-size: 14px;
    `;
    this.playPauseButton.addEventListener('mouseenter', () => {
      this.playPauseButton.style.background = 'var(--background-modifier-hover)';
    });
    this.playPauseButton.addEventListener('mouseleave', () => {
      this.playPauseButton.style.background = 'transparent';
    });

    // 停止按钮
    this.stopButton = document.createElement('button');
    this.stopButton.innerHTML = '⏹';
    this.stopButton.className = 'inline-tts-stop-btn';
    this.stopButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--text-normal);
      font-size: 14px;
    `;
    this.stopButton.addEventListener('mouseenter', () => {
      this.stopButton.style.background = 'var(--background-modifier-hover)';
    });
    this.stopButton.addEventListener('mouseleave', () => {
      this.stopButton.style.background = 'transparent';
    });

    // 进度条
    this.progressBar = document.createElement('input');
    this.progressBar.type = 'range';
    this.progressBar.min = '0';
    this.progressBar.max = '100';
    this.progressBar.value = '0';
    this.progressBar.className = 'inline-tts-progress';
    this.progressBar.style.cssText = `
      flex: 1;
      height: 4px;
      background: var(--background-modifier-border);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    `;

    // 时间显示
    this.timeDisplay = document.createElement('span');
    this.timeDisplay.className = 'inline-tts-time';
    this.timeDisplay.textContent = '0:00 / 0:00';
    this.timeDisplay.style.cssText = `
      min-width: 70px;
      text-align: right;
      color: var(--text-muted);
    `;

    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '✕';
    deleteButton.className = 'inline-tts-delete-btn';
    deleteButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--text-muted);
      font-size: 12px;
    `;
    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.background = 'var(--background-modifier-error)';
      deleteButton.style.color = 'var(--text-error)';
    });
    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.background = 'transparent';
      deleteButton.style.color = 'var(--text-muted)';
    });
    deleteButton.addEventListener('click', () => {
      this.destroy();
    });

    container.appendChild(this.playPauseButton);
    container.appendChild(this.stopButton);
    container.appendChild(this.progressBar);
    container.appendChild(this.timeDisplay);
    container.appendChild(deleteButton);

    return container;
  }

  private bindEvents(): void {
    this.playPauseButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });

    this.stopButton.addEventListener('click', () => {
      this.stop();
    });

    this.progressBar.addEventListener('input', () => {
      const value = parseFloat(this.progressBar.value);
      const time = (value / 100) * this.duration;
      this.seek(time);
    });
  }

  public play(): void {
    this.isPlaying = true;
    this.isPaused = false;
    this.playPauseButton.innerHTML = '⏸';
    this.onPlay?.();
    this.startProgressUpdate();
  }

  public pause(): void {
    this.isPlaying = false;
    this.isPaused = true;
    this.playPauseButton.innerHTML = '▶';
    this.onPause?.();
    this.stopProgressUpdate();
  }

  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.playPauseButton.innerHTML = '▶';
    this.updateProgress();
    this.onStop?.();
    this.stopProgressUpdate();
  }

  public seek(time: number): void {
    this.currentTime = time;
    this.updateProgress();
    this.onSeek?.(time);
  }

  public updateTime(currentTime: number, duration: number): void {
    this.currentTime = currentTime;
    this.duration = duration;
    this.updateProgress();
  }

  private updateProgress(): void {
    if (this.duration > 0) {
      const progress = (this.currentTime / this.duration) * 100;
      this.progressBar.value = progress.toString();
    }
    
    this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private startProgressUpdate(): void {
    this.stopProgressUpdate();
    this.updateInterval = window.setInterval(() => {
      if (this.isPlaying) {
        this.updateProgress();
      }
    }, 500);
  }

  private stopProgressUpdate(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public destroy(): void {
    this.stopProgressUpdate();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}

/**
 * 在编辑器指定位置插入进度条
 */
export function insertProgressBarAtCursor(
  editor: Editor,
  callbacks?: {
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onSeek?: (time: number) => void;
  }
): InlineProgressBar | null {
  try {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    
    // 在当前行后插入一个新行
    const newLine = cursor.line + 1;
    editor.replaceRange('\n', { line: cursor.line, ch: line.length });
    
    // 创建进度条占位符
    const placeholder = `<!-- TTS Progress Bar ${Date.now()} -->`;
    editor.replaceRange(placeholder, { line: newLine, ch: 0 });
    
    // 获取编辑器DOM元素
    const editorEl = (editor as any).cm.dom as HTMLElement;
    const lines = editorEl.querySelectorAll('.cm-line');
    const targetLine = lines[newLine] as HTMLElement;
    
    if (targetLine) {
      // 隐藏占位符文本
      const placeholderSpan = targetLine.querySelector('.cm-line') as HTMLElement;
      if (placeholderSpan) {
        placeholderSpan.style.display = 'none';
      }
      
      // 创建进度条
      const progressBar = new InlineProgressBar(targetLine, callbacks);
      return progressBar;
    }
    
    return null;
  } catch (error) {
    console.error('Error inserting progress bar:', error);
    return null;
  }
}

