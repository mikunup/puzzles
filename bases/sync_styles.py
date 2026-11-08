#!/usr/bin/env python3
"""Embed bases/base.css into standalone HTML pages without external dependencies."""

import argparse
from pathlib import Path
import re
import time


ROOT = Path(__file__).resolve().parent.parent
START = "<!-- bases:styles:start -->"
END = "<!-- bases:styles:end -->"
BLOCK = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)


def sync(root=ROOT, check=False):
    css = (root / "bases/base.css").read_text(encoding="utf-8").rstrip()
    if "</style" in css.lower():
        raise ValueError("base.cssにHTMLの終了タグは記述できません。")
    block = f"{START}\n<style>\n{css}\n</style>\n{END}"
    pages = sorted([*root.glob("*.html"), *(root / "bases").glob("*.html")])
    updates = []
    for page in pages:
        original = page.read_text(encoding="utf-8")
        if original.count(START) != 1 or original.count(END) != 1 or len(BLOCK.findall(original)) != 1:
            raise ValueError(f"{page.relative_to(root)}: 共通CSSの開始・終了マーカーを1組配置してください。")
        updated = BLOCK.sub(lambda _: block, original)
        if original != updated:
            updates.append((page, updated))
    # Validate every page before writing, so missing markers never cause partial updates.
    for page, updated in updates:
        if not check:
            page.write_text(updated, encoding="utf-8")
        print(f"{'未反映' if check else '更新'}: {page.relative_to(root)}", flush=True)
    return len(updates)


def main():
    parser = argparse.ArgumentParser(description="base.cssを各HTML内の共通CSS領域へ反映します。")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--check", action="store_true", help="書き換えずに未反映の有無を確認")
    modes.add_argument("--watch", action="store_true", help="変更を監視し、保存時に自動反映（Ctrl+Cで終了）")
    args = parser.parse_args()
    if args.watch:
        print("base.cssとHTMLを監視中。終了: Ctrl+C", flush=True)
        previous_error = None
        try:
            while True:
                try:
                    sync()
                    previous_error = None
                except (OSError, ValueError) as error:
                    if str(error) != previous_error:
                        print(f"エラー: {error}", flush=True)
                        previous_error = str(error)
                time.sleep(0.5)
        except KeyboardInterrupt:
            return 0
    try:
        changed = sync(check=args.check)
    except (OSError, ValueError) as error:
        parser.exit(1, f"エラー: {error}\n")
    if not changed:
        print("すべてのHTMLに反映済みです。")
    return int(args.check and changed > 0)


if __name__ == "__main__":
    raise SystemExit(main())
