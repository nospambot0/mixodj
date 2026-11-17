#!/usr/bin/env python3
"""Import newly listed Play4u catalogue metadata into ReelRoom.

Only public catalogue/detail-page metadata is imported. The script does not
extract media streams, bypass access controls, or download video files.
"""
from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

BASE = "https://play4u.org/"
CATALOGUES = ("?cat=latest", "?type=movie", "?type=series")
DATA_FILE = Path("data/movies.json")
USER_AGENT = "ReelRoomCatalogueBot/1.0 (+https://reelroom.in)"
MAX_NEW_PER_RUN = 40
TIMEOUT = 20

def allowed_by_robots(session: requests.Session) -> RobotFileParser:
    robots_url = urljoin(BASE, "robots.txt")
    response = session.get(robots_url, timeout=TIMEOUT)
    if response.status_code >= 400:
        raise RuntimeError(f"Could not verify robots.txt (HTTP {response.status_code}); stopping safely.")
    parser = RobotFileParser()
    parser.set_url(robots_url)
    parser.parse(response.text.splitlines())
    for path in ("/", "/watch/"):
        if not parser.can_fetch(USER_AGENT, urljoin(BASE, path)):
            raise RuntimeError(f"robots.txt disallows crawling {path}; stopping safely.")
    return parser

def get_soup(session: requests.Session, url: str) -> BeautifulSoup:
    response = session.get(url, timeout=TIMEOUT)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")

def canonical_title_page(href: str) -> str | None:
    url = urljoin(BASE, href)
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc.lower() not in {"play4u.org", "www.play4u.org"}:
        return None
    if not re.search(r"/(?:watch/)?tt\d+/?$", parsed.path):
        return None
    return url.rstrip("/")

def meta(soup: BeautifulSoup, *keys: str) -> str:
    for key in keys:
        tag = soup.find("meta", attrs={"property": key}) or soup.find("meta", attrs={"name": key})
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
    return ""

def get_detail(session: requests.Session, url: str) -> dict | None:
    soup = get_soup(session, url)
    imdb_match = re.search(r"(tt\d+)", url)
    if not imdb_match:
        return None
    h1 = soup.find("h1")
    title = h1.get_text(" ", strip=True) if h1 else meta(soup, "og:title", "twitter:title")
    title = re.sub(r"\s*[|—-]\s*Play4u\s*$", "", title, flags=re.I).strip()
    if not title:
        return None

    description = meta(soup, "og:description", "description")
    poster = meta(soup, "og:image", "twitter:image")
    text = soup.get_text(" ", strip=True)

    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", title + " " + text)
    year = year_match.group(1) if year_match else ""
    genre = "Other"
    # Detail pages show release metadata as: date · runtime · languages · genres.
    detail_line = next((line for line in soup.stripped_strings if "·" in line and re.search(r"\b(19\d{2}|20\d{2})\b", line)), "")
    if detail_line:
        parts = [part.strip() for part in detail_line.split("·")]
        if len(parts) >= 4:
            genre = parts[-1].split(",")[0].strip() or genre
        if len(parts) >= 1:
            date_year = re.search(r"\b(19\d{2}|20\d{2})\b", parts[0])
            if date_year:
                year = date_year.group(1)

    return {
        "id": f"play4u-{imdb_match.group(1)}",
        "title": title,
        "url": url,
        "sourceType": "embed",
        "year": year,
        "genre": genre,
        "description": description,
        "poster": poster,
        "addedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
    }

def main() -> int:
    if not DATA_FILE.exists():
        raise RuntimeError(f"Catalogue file not found: {DATA_FILE}")
    entries = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise RuntimeError("data/movies.json must contain a JSON array.")

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})
    allowed_by_robots(session)

    known_ids = {str(item.get("id", "")) for item in entries if isinstance(item, dict)}
    known_urls = {str(item.get("url", "")).rstrip("/") for item in entries if isinstance(item, dict)}
    discovered: list[str] = []

    for catalogue in CATALOGUES:
        listing_url = urljoin(BASE, catalogue)
        soup = get_soup(session, listing_url)
        for anchor in soup.find_all("a", href=True):
            detail_url = canonical_title_page(str(anchor["href"]))
            if detail_url and detail_url not in known_urls and detail_url not in discovered:
                discovered.append(detail_url)

    added = 0
    for url in discovered:
        if added >= MAX_NEW_PER_RUN:
            break
        try:
            item = get_detail(session, url)
            if not item or item["id"] in known_ids:
                continue
            entries.append(item)
            known_ids.add(item["id"])
            known_urls.add(url)
            added += 1
            print(f"Added: {item['title']} ({item.get('year', 'year unknown')})")
            time.sleep(0.5)
        except requests.RequestException as exc:
            print(f"Skipping {url}: {exc}", file=sys.stderr)
        except Exception as exc:
            print(f"Skipping {url}: {exc}", file=sys.stderr)

    if added:
        DATA_FILE.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Discovered {len(discovered)} unseen pages; added {added} titles.")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Catalogue update stopped: {error}", file=sys.stderr)
        raise SystemExit(1)
