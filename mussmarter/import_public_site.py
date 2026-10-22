#!/usr/bin/env python3
"""Public WordPress.com -> self-contained MussMarter archive. Never deploys."""
import hashlib, html, json, re, time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

ROOT="https://themussmarter.com/"
OUT=Path("mussmarter/site")
MEDIA=OUT/"assets"
MEDIA.mkdir(parents=True,exist_ok=True)
s=requests.Session()
s.headers["User-Agent"]="MussMarter personal preservation migration"
failures=[]
image_cache={}
posts=[]
def slug(s):
    return re.sub(r"[^a-z0-9-]+","-",s.lower()).strip("-")[:100] or "story"
def get(url):
    r=s.get(url,timeout=50)
    r.raise_for_status()
    return r
def image_url(tag,base):
    # Preserve full-quality linked media rather than WordPress thumbnail sizes
    parent=tag.find_parent("a",href=True)
    candidates=[tag.get("data-orig-file"),parent.get("href") if parent else None,tag.get("data-large-file"),tag.get("src"),tag.get("data-src")]
    for candidate in candidates:
        if candidate and re.search(r"\.(?:jpe?g|png|gif|webp|avif)(?:\?|$)",candidate,re.I):
            return urljoin(base,candidate)
    return urljoin(base,tag.get("src","")) if tag.get("src") else None
def save_image(url):
    if url in image_cache:return image_cache[url]
    try:
        res=get(url)
        if not res.headers.get("content-type","").lower().startswith("image/"):raise ValueError("Response is not an image")
        ext=Path(urlparse(url).path).suffix.lower()
        if ext not in (".png",".jpg",".jpeg",".webp",".gif",".avif"):ext=".jpg"
        name=hashlib.sha256(url.encode()).hexdigest()[:20]+ext
        (MEDIA/name).write_bytes(res.content)
        image_cache[url]="assets/"+name
        return image_cache[url]
    except Exception as exc:
        failures.append({"image":url,"error":str(exc)})
        return None
def clean_content(raw,url):
    soup=BeautifulSoup(raw or "","html.parser")
    photos=[]
    for img in soup.select("img"):
        source=image_url(img,url)
        if not source:continue
        local=save_image(source)
        if not local:continue
        photos.append(local)
        img["src"]="../../"+local
        for attr in ("srcset","sizes","data-src","data-large-file","data-orig-file","data-medium-file","loading"):
            img.attrs.pop(attr,None)
        anchor=img.find_parent("a",href=True)
        if anchor and re.search(r"\.(?:jpe?g|png|gif|webp|avif)(?:\?|$)",anchor["href"],re.I):
            anchor["href"]="../../"+local
    for el in soup.select("script,style,iframe[src*='facebook'],.sharedaddy,.jp-relatedposts,.sd-sharing"):
        el.decompose()
    return str(soup),photos
# WordPress.com public API exposes FULL article content, not excerpts.
endpoint="https://public-api.wordpress.com/rest/v1.1/sites/themussmarter.com/posts/"
api_ok=False
try:
    page=1
    while True:
        payload=get(endpoint+"?number=100&page="+str(page)).json()
        batch=payload.get("posts",[])
        if not batch:break
        api_ok=True
        for p in batch:
            if p.get("status")!="publish":continue
            posts.append({"title":BeautifulSoup(p.get("title",""),"html.parser").get_text(" ",strip=True),
                "date":p.get("date",""),"url":p.get("URL",""),"body":p.get("content",""),
                "categories":list(p.get("categories",{}).keys())})
        if len(batch)<100:break
        page+=1
        if page>100:raise RuntimeError("Excessive pagination")
except Exception as exc:
    failures.append({"api":endpoint,"error":str(exc)})
if not posts:
    # Fallback: crawl public paginated index and retrieve each SINGLE post in full.
    # This is deliberately not limited to the 10 articles on the first page.
    from collections import deque
    queue=deque([ROOT])
    visited=set()
    links=set()
    while queue:
        address=queue.popleft()
        if address in visited:continue
        visited.add(address)
        try:
            doc=BeautifulSoup(get(address).text,"html.parser")
            for a in doc.select("a[href]"):
                target=urljoin(address,a["href"]).split("#")[0].split("?")[0]
                if urlparse(target).netloc!=urlparse(ROOT).netloc:continue
                if re.search(r"/(?:19|20)\\d{2}/\\d{2}/\\d{2}/[^/]+/?$",urlparse(target).path):links.add(target)
                if re.search(r"/page/\\d+/?$",urlparse(target).path) and target not in visited:queue.append(target)
        except Exception as exc:failures.append({"archive_page":address,"error":str(exc)})
    for address in sorted(links):
        try:
            doc=BeautifulSoup(get(address).text,"html.parser")
            article=doc.select_one("article")
            body=article.select_one(".entry-content") if article else None
            title=article.select_one("h1.entry-title,h1") if article else None
            if not body or not title:
                failures.append({"post":address,"error":"Missing complete post markup"})
                continue
            timestamp=article.select_one("time[datetime]")
            categories=[a.get_text(" ",strip=True) for a in article.select("a[rel='category tag']")]
            posts.append({"title":title.get_text(" ",strip=True),"date":timestamp.get("datetime","") if timestamp else "", "url":address, "body":str(body), "categories":categories})
        except Exception as exc:failures.append({"post":address,"error":str(exc)})
# Use site-specific posts, preserving their title, full HTML and inline order.
if not posts:raise SystemExit("Could not retrieve original posts. No substitute content generated.")
CSS="""*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f2e6c8;color:#253c38;font:18px/1.75 Georgia,serif}a{color:inherit}nav{display:flex;justify-content:space-between;gap:16px;padding:19px 5vw;background:#24433d;color:#f5e7c6;font:900 15px Arial,sans-serif;text-transform:uppercase}nav a{text-decoration:none}.hero{background:#efbb67;padding:6vw 5vw;border-bottom:7px solid #253c38}.kicker,.meta{font:900 12px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}h1{font:1000 clamp(55px,10vw,132px)/.85 Arial,sans-serif;letter-spacing:-.09em;text-transform:uppercase;margin:22px 0}h1 em{color:#c74730;font-style:normal}h2{font:900 clamp(24px,3vw,40px)/1 Arial,sans-serif;text-transform:uppercase;letter-spacing:-.055em}.intro{font:700 19px Arial,sans-serif}.grid{max-width:1400px;padding:5vw;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:27px}.card{background:#f8ebcf;text-decoration:none;border:3px solid #253c38;box-shadow:5px 5px 0 #253c38;transition:transform .25s}.card:hover{transform:translateY(-6px)}.card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}.card section{padding:18px}.card h2{margin:8px 0}.story{max-width:840px;margin:auto;padding:6vw 25px 90px}.story h1{font-size:clamp(42px,7vw,89px)}.story-content img{max-width:100%;height:auto;display:block;margin:25px auto}.story-content figure{margin:30px 0}.story-content figcaption{font:14px Arial,sans-serif;color:#53615b;text-align:center}footer{background:#24433d;color:#fff0d4;text-align:center;padding:25px;font:900 12px Arial,sans-serif;letter-spacing:.1em}button{cursor:pointer}.back{font:800 12px Arial,sans-serif;text-decoration:none} @media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}"""
(OUT/"style.css").write_text(CSS,encoding="utf-8")
def shell(title,main,up=""):
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>'+html.escape(title)+' | The MussMarter</title><link rel="stylesheet" href="'+up+'style.css"></head><body><nav><a href="'+up+'index.html">THE MUSSMARTER.</a><span>STEPHEN + KATIE · EST 2014</span></nav>'+main+'<footer>WE COME WITH BAGGAGE · THE MUSSMARTER</footer></body></html>'
cards=[]
report=[]
for i,p in enumerate(sorted(posts,key=lambda p:p["date"],reverse=True)):
    title=p["title"]; url=p["url"]
    content,photos=clean_content(p["body"],url)
    path="stories/"+str(i+1).zfill(3)+"-"+slug(title)
    dest=OUT/path
    dest.mkdir(parents=True,exist_ok=True)
    a='<main class="story"><a class="back" href="../../index.html">← BACK TO ALL STORIES</a><p class="meta">'+html.escape(p["date"][:10])+'</p><h1>'+html.escape(title)+'</h1><div class="story-content">'+content+'</div></main>'
    (dest/"index.html").write_text(shell(title,a,"../../"),encoding="utf-8")
    cover='<img src="'+photos[0]+'" alt="" loading="lazy">' if photos else ''
    cards.append('<a class="card" href="'+path+'/index.html">'+cover+'<section><p class="meta">'+html.escape(p["date"][:10])+'</p><h2>'+html.escape(title)+'</h2><span>READ STORY ↗</span></section></a>')
    report.append({"title":title,"date":p["date"],"original_url":url,"local_path":path+"/index.html","photos":len(photos),"categories":p["categories"],"image_paths":photos})
    print("Imported",i+1,title,"photos",len(photos),flush=True)
    time.sleep(.08)
main='<header class="hero"><div class="kicker">STEPHEN + KATIE / PERSONAL TRAVEL ARCHIVE</div><h1>WE COME<br>WITH <em>BAGGAGE.</em></h1><p class="intro">Our stories, photographs and adventures, preserved for the long haul.</p><p class="kicker">'+str(len(report))+' ORIGINAL STORIES</p></header><div class="grid">'+''.join(cards)+'</div>'
(OUT/"index.html").write_text(shell("We Come With Baggage",main),encoding="utf-8")
(OUT/"migration-report.json").write_text(json.dumps({"source":ROOT,"post_count":len(report),"downloaded_images":len(image_cache),"failures":failures,"posts":report},ensure_ascii=False,indent=2),encoding="utf-8")
print("COMPLETE:",len(report),"posts,",len(image_cache),"images,",len(failures),"failures",flush=True)
