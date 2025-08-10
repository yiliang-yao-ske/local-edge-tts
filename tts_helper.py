#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Edge TTS Helper Script for Obsidian Plugin
Provides TTS functionality using Microsoft Edge's speech synthesis
"""

import asyncio
import sys
import json
import os
import tempfile
import argparse
import time
from edge_tts import Communicate, list_voices

# 预定义的语音选项 - 中文、英语、西班牙语的主要语音
VOICE_OPTIONS = {
    # 中文语音
    "zh-CN-XiaoxiaoNeural": "中文 (普通话，大陆) - 晓晓 (女)",
    "zh-CN-YunxiNeural": "中文 (普通话，大陆) - 云希 (男)",
    "zh-CN-YunyangNeural": "中文 (普通话，大陆) - 云扬 (男)",
    "zh-CN-XiaoyiNeural": "中文 (普通话，大陆) - 晓伊 (女)",
    "zh-CN-YunjianNeural": "中文 (普通话，大陆) - 云健 (男)",
    "zh-CN-YunxiaNeural": "中文 (普通话，大陆) - 云夏 (男)",
    "zh-CN-XiaochenNeural": "中文 (普通话，大陆) - 晓辰 (女)",
    "zh-CN-XiaohanNeural": "中文 (普通话，大陆) - 晓涵 (女)",
    "zh-CN-XiaomoNeural": "中文 (普通话，大陆) - 晓墨 (女)",
    "zh-CN-XiaoqiuNeural": "中文 (普通话，大陆) - 晓秋 (女)",
    "zh-CN-XiaoruiNeural": "中文 (普通话，大陆) - 晓睿 (女)",
    "zh-CN-XiaoshuangNeural": "中文 (普通话，大陆) - 晓双 (女，儿童)",
    "zh-CN-XiaoxuanNeural": "中文 (普通话，大陆) - 晓萱 (女)",
    "zh-CN-XiaoyanNeural": "中文 (普通话，大陆) - 晓颜 (女)",
    "zh-CN-XiaoyouNeural": "中文 (普通话，大陆) - 晓悠 (女，儿童)",
    "zh-CN-XiaozhenNeural": "中文 (普通话，大陆) - 晓甄 (女)",
    "zh-CN-YunfengNeural": "中文 (普通话，大陆) - 云枫 (男)",
    "zh-CN-YunhaoNeural": "中文 (普通话，大陆) - 云皓 (男)",
    "zh-CN-YunyeNeural": "中文 (普通话，大陆) - 云野 (男)",
    "zh-CN-YunzeNeural": "中文 (普通话，大陆) - 云泽 (男)",
    
    # 台湾中文
    "zh-TW-HsiaoChenNeural": "中文 (台湾) - 晓臻 (女)",
    "zh-TW-YunJheNeural": "中文 (台湾) - 云哲 (男)",
    "zh-TW-HsiaoYuNeural": "中文 (台湾) - 晓雨 (女)",
    
    # 英语语音
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
    "en-US-AvaMultilingualNeural": "English (US) - Ava Multilingual (Female)",
    "en-US-AndrewMultilingualNeural": "English (US) - Andrew Multilingual (Male)",
    "en-US-EmmaMultilingualNeural": "English (US) - Emma Multilingual (Female)",
    "en-US-BrianMultilingualNeural": "English (US) - Brian Multilingual (Male)",
    
    # 英国英语
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
    
    # 澳大利亚英语
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
    "en-AU-TinaNeural": "English (Australia) - Tina (Female)",
    
    # 西班牙语 - 仅包含已验证可用的语音
    "es-ES-ElviraNeural": "Español (España) - Elvira (Mujer)",
    "es-ES-AlvaroNeural": "Español (España) - Álvaro (Hombre)",
    "es-MX-DaliaNeural": "Español (México) - Dalia (Mujer)",
    "es-MX-JorgeNeural": "Español (México) - Jorge (Hombre)",
    "es-AR-ElenaNeural": "Español (Argentina) - Elena (Mujer)",
    "es-AR-TomasNeural": "Español (Argentina) - Tomás (Hombre)",
}

def filter_markdown(text):
    """简单的Markdown过滤函数"""
    import re
    
    # 移除前置内容(frontmatter)
    text = re.sub(r'^-{3}[\s\S]*?-{3}\n?', '', text)
    
    # 移除代码块
    text = re.sub(r'```[\s\S]*?```', '', text)
    
    # 移除行内代码
    text = re.sub(r'`([^`]*)`', r'\1', text)
    
    # 移除链接但保留文本
    text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
    
    # 移除wiki链接但保留文本
    text = re.sub(r'\[\[([^\]|]*)\|([^\]]*)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^\]]*)\]\]', r'\1', text)
    
    # 移除图片
    text = re.sub(r'!\[([^\]]*)\]\([^)]*\)', '', text)
    text = re.sub(r'!\[\[([^\]]*)\]\]', '', text)
    
    # 移除加粗和斜体标记
    text = re.sub(r'(\*\*|__)(.*?)\1', r'\2', text)
    text = re.sub(r'(\*|_)(.*?)\1', r'\2', text)
    
    # 移除高亮标记
    text = re.sub(r'==([^=]*)==', r'\1', text)
    
    # 移除标题、列表标记等
    text = re.sub(r'^[#*-]+\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^[\-\+\*]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d+\.\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    
    # 清理多余空白
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = text.strip()
    
    return text

async def get_voices():
    """获取所有可用语音"""
    try:
        voices = await list_voices()
        return voices
    except Exception as e:
        print(f"Error getting voices: {e}", file=sys.stderr)
        return []

async def generate_tts(text, voice, rate, output_file):
    """生成TTS音频文件"""
    try:
        print(f"Starting TTS generation with voice: {voice}, rate: {rate}", file=sys.stderr)
        
        # 过滤文本
        clean_text = filter_markdown(text)
        
        if not clean_text.strip():
            raise ValueError("No text to speak after filtering")
        
        print(f"Cleaned text length: {len(clean_text)} chars", file=sys.stderr)
        print(f"Text preview: {clean_text[:100]}...", file=sys.stderr)
        
        # 创建TTS通信对象
        communicate = Communicate(clean_text, voice, rate=rate)
        
        # 生成音频并保存
        audio_chunks = 0
        total_bytes = 0
        
        with open(output_file, "wb") as file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    file.write(chunk["data"])
                    audio_chunks += 1
                    total_bytes += len(chunk["data"])
        
        print(f"Generated {audio_chunks} audio chunks, total bytes: {total_bytes}", file=sys.stderr)
        
        # 检查输出文件
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            print(f"Output file size: {file_size} bytes", file=sys.stderr)
            
            if file_size == 0:
                raise ValueError("Generated audio file is empty")
                
            if file_size < 1000:  # 少于1KB可能有问题
                print(f"Warning: Generated audio file is very small ({file_size} bytes)", file=sys.stderr)
        else:
            raise ValueError("Output file was not created")
        
        return True
    except Exception as e:
        print(f"Error generating TTS: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False

def main():
    # 设置默认编码为UTF-8
    import locale
    import codecs
    
    # 确保stdout/stderr使用UTF-8编码
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    elif hasattr(sys.stdout, 'buffer'):
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)
    
    parser = argparse.ArgumentParser(description='Edge TTS Helper')
    parser.add_argument('command', nargs='?', choices=['list-voices', 'speak'], help='Command to execute')
    parser.add_argument('--text', help='Text to speak')
    parser.add_argument('--voice', default='zh-CN-XiaoxiaoNeural', help='Voice to use')
    parser.add_argument('--rate', default='+0%', help='Speaking rate')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--config', help='JSON config file path')
    
    args = parser.parse_args()
    
    # 处理配置文件模式
    if args.config:
        try:
            with open(args.config, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # 从配置文件读取参数
            command = config.get('command', 'speak')
            text_to_speak = config.get('text', '')
            voice = config.get('voice', 'zh-CN-XiaoxiaoNeural')
            rate = config.get('rate', '+0%')
            output_file = config.get('output', None)
            
        except Exception as e:
            print(f"Error reading config file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # 使用命令行参数
        command = args.command
        text_to_speak = args.text
        voice = args.voice
        rate = args.rate
        output_file = args.output
    
    if command == 'list-voices':
        # 返回预定义的语音选项
        print(json.dumps(VOICE_OPTIONS, ensure_ascii=False, indent=2))
        
    elif command == 'speak':
        if not text_to_speak:
            print("Error: No text provided", file=sys.stderr)
            sys.exit(1)
        
        # 确保文本参数使用正确的编码
        if isinstance(text_to_speak, bytes):
            text_to_speak = text_to_speak.decode('utf-8')
        
        # 验证文本包含有效字符
        print(f"Received text length: {len(text_to_speak)} chars", file=sys.stderr)
        print(f"Text preview: {text_to_speak[:50]}...", file=sys.stderr)
        
        if not output_file:
            # 创建插件目录下的temp文件夹
            script_dir = os.path.dirname(os.path.abspath(__file__))
            temp_dir = os.path.join(script_dir, 'temp')
            
            # 确保temp目录存在
            if not os.path.exists(temp_dir):
                os.makedirs(temp_dir)
            
            # 生成基于文本内容的文件名：文本前10个字符 + 10位Unix时间戳
            import re
            text_prefix = re.sub(r'[^\w\u4e00-\u9fff]', '_', text_to_speak[:10])  # 保留中英文字符，其他替换为下划线
            timestamp = str(int(time.time()))  # 10位Unix时间戳
            output_file = os.path.join(temp_dir, f'{text_prefix}_{timestamp}.mp3')
        
        # 运行TTS生成
        success = asyncio.run(generate_tts(text_to_speak, voice, rate, output_file))
        
        if success:
            print(json.dumps({"success": True, "file": output_file}))
        else:
            print(json.dumps({"success": False, "error": "Failed to generate TTS"}))
            sys.exit(1)

if __name__ == "__main__":
    main()
