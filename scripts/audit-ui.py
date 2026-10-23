#!/usr/bin/env python3
"""静态风险线索扫描：非 AST 检查，不等于真实诊断。用法 python scripts/audit-ui.py /path/to/project"""
from pathlib import Path
import argparse
import re

RULES = [
    ('R1', '显式页面刷新', re.compile(r'\b(?:window\.)?location\.reload\s*\(')),
    ('R2', '不稳定 key 线索', re.compile(r'\bkey\s*=\s*\{\s*(?:Math\.random\s*\(|Date\.now\s*\()')),
    ('R3', '全局事件屏蔽线索', re.compile(r'pointer-events\s*:\s*none|pointerEvents\s*:\s*[\'\"]none')),
    ('R4', '未限定的 query invalidation 线索', re.compile(r'invalidateQueries\s*\(\s*\)')),
    ('R5', '取消流线索（需要审计 useEffect cleanup 生命周期）', re.compile(r'\.abort\s*\(|\.close\s*\(')),
    ('R6', '可疑全屏 Loading 标记', re.compile(r'FullScreenLoad(?:ing|er)|GlobalLoadingOverlay|LoadingBackdrop', re.I)),
]
EXCLUDE = {'node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'vendor', '.venv'}
SUFFIXES = {'.js', '.jsx', '.ts', '.tsx', '.vue', '.css', '.scss', '.svelte'}

def scan(root: Path):
    hits = []
    for file in root.rglob('*'):
        if not file.is_file() or file.suffix not in SUFFIXES or any(x in EXCLUDE for x in file.parts):
            continue
        if file.stat().st_size > 800_000:
            continue
        try:
            lines = file.read_text(encoding='utf8').splitlines()
        except (UnicodeError, OSError):
            continue
        for number, line in enumerate(lines, 1):
            for code, title, pattern in RULES:
                if pattern.search(line):
                    hits.append((str(file.relative_to(root)), number, code, title, line.strip()[:130]))
    return hits

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('project', type=Path, help='待审查项目根目录')
    args = p.parse_args()
    if not args.project.is_dir():
        p.error(f'不存在目录: {args.project}')
    findings = scan(args.project)
    if findings:
        for name, line, code, desc, snippet in findings:
            print(f'{name}:{line}: [{code}] {desc}: {snippet}')
        print(f'\n共 {len(findings)} 个代码线索。必须结合运行时/Network/Profiler 确认根因。')
    else:
        print('未发现这些特定模式；不代表页面一定没有布局或渲染问题。')
