#!/usr/bin/env python3
"""Preserve public MussMarter posts and the image files they reference."""
import hashlib, json, re, time, html
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag
import requests
from bs4 import BeautifulSoup

ROOT="https://themussmarter.com/"
OUT=Path("mussmarter/site")
ASSETS=OUT/"assets"
ASSETS.mkdir(parents=True,exist_ok=True)
session=requests.Session()
session.headers.update({"User-Agent":"MussMarter personal preservation archive (+https://themussmarter.com/)"})
def norm(url):
    u=urldefrag(url)[0].split("?")[0]
    return u.rstrip("/")+"/"
def slug(x):
    return re.sub(r"[^a-z0-9]+","-",x.lower()).strip("-")
queue=deque([ROOT])
seen=set()
articles={}
images={}
failures=[]
def save_image(url):
    url=urljoin(ROOT,url)
    if url in images:return images[url]
    try:
        resp=session.get(url,timeout=40)
        resp.raise_for_status()
        if not resp.headers.get("content-type","").startswith("image/"):
            raise ValueError("not image")
        suffix=Path(urlparse(url).path).suffix.lower()
        if suffix not in {".jpg",".jpeg",".png",".gif",".webp",".avif"}:suffix=".jpg"
        name=hashlib.sha256(url.encode()).hexdigest()[:16]+suffix
        (ASSETS/name).write_bytes(resp.content)
        images[url]="assets/"+name
        return images[url]
    except Exception as e:
        failures.append({"image":url,"error":str(e)})
        return url

while queue:
    url=queue.popleft()
    if norm(url) in seen:continue
    seen.add(norm(url))
    try:
        resp=session.get(url,timeout=40)
        resp.raise_for_status()
        soup=BeautifulSoup(resp.text,"html.parser")
    except Exception as e:
        failures.append({"page":url,"error":str(e)})
        continue
    for link in soup.select("a[href]"):
        href=urljoin(url,link["href"])
        u=urlparse(href)
        if u.netloc != urlparse(ROOT).netloc:continue
        if re.search(r"/(?:20|19)\d{2}/\d{2}/\d{2}/",u.path) or re.search(r"/page/\d+/?$",u.path) or re.search(r"/category/[^/]+",u.path):
            if norm(href) not in seen:queue.append(href)
    # Only archive canonical single-post pages, never excerpts on category pages.
    if not re.search(r"/(?:20|19)\d{2}/\d{2}/\d{2}/[^/]+/?$",urlparse(url).path):continue
    article=soup.select_one("article.post,article.type-post,article[id^=post-]")
    if not article:article=soup
    title_el=article.select_one(".entry-title,h1")
    body=article.select_one(".entry-content")
    if not title_el or not body:
        failures.append({"post":url,"error":"story body not found"})
        continue
    title=title_el.get_text(" ",strip=True)
    dated=article.select_one("time[datetime]")
    date=dated.get("datetime","") if dated else ""
    content=BeautifulSoup(str(body),"html.parser")
    cover=""
    for image in content.select("img"):
        anchor=image.find_parent("a",href=True)
        link=anchor.get("href","") if anchor else ""
        src=image.get("data-orig-file") or image.get("src") or image.get("data-src")
        if link and re.search(r"\.(?:jpg|jpeg|png|gif|webp)(?:\?|$)",link,re.I):src=link
        if not src:continue
        local=save_image(urljoin(url,src))
        if not cover and local.startswith("assets/"):cover=local
        image["src"]="../../"+local if local.startswith("assets/") else local
        for attr in ("srcset","sizes","data-src","data-orig-file","data-large-file"):
            image.attrs.pop(attr,None)
        if anchor and local.startswith("assets/"):anchor["href"]="../../"+local
    for unwanted in content.select("script,style,form,.sharedaddy,.jp-relatedposts,.sd-sharing,.wpl-likebox"):
        unwanted.decompose()
    path=urlparse(url).path.strip("/").split("/")
    permalink="stories/"+path[0]+"-"+slug(path[-1])+"/index.html"
    articles[norm(url)]={"title":title,"date":date,"cover":cover,"html":str(content),"path":permalink,"source":url}
    print("Archived",len(articles),title,"photos",len(images),flush=True)
    time.sleep(.1)
CSS="""*{box-sizing:border-box}body{margin:0;background:#f7f5f0;color:#202a28;font:18px/1.7 Georgia,serif}a{color:inherit}nav{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1.25rem 5vw;border-bottom:1px solid #dedbd2;font:600 13px system-ui}nav a{text-decoration:none}.hero{padding:8vw 5vw 7vw;background:#e3ebe4;text-align:center}.eyebrow,.meta{font:600 12px system-ui;letter-spacing:.15em;text-transform:uppercase;color:#52655f}h1{font-size:clamp(3rem,8vw,7.5rem);font-weight:400;line-height:1.05;letter-spacing:-.045em;margin:1rem 0}h2{font-size:clamp(1.5rem,3vw,2.3rem);font-weight:400;line-height:1.2}.intro{max-width:650px;margin:auto}.wrap{max-width:1250px;margin:auto;padding:5rem 5vw}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:2.3rem}.card{text-decoration:none}.card img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#e4e0d9}.card .meta{margin-top:1rem}.story{max-width:800px;margin:auto;padding:5rem 24px 8rem}.story h1{font-size:clamp(2.8rem,6vw,5.7rem)}.story-content img{max-width:100%;height:auto;display:block;margin:2rem auto}.story-content figure{margin:3rem 0}.story-content figcaption{font:14px system-ui;text-align:center;color:#555}.story-content iframe{max-width:100%}footer{text-align:center;padding:3rem;border-top:1px solid #ddd;font:13px system-ui}@media(max-width:600px){nav span{display:none}.wrap{padding:3rem 20px}.story{padding-top:3rem}}"""
(OUT/"style.css").write_text(CSS)
def shell(title,content,prefix=""):
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>'+html.escape(title)+' | The MussMarter</title><link rel="stylesheet" href="'+prefix+'style.css"></head><body><nav><a href="'+prefix+'index.html">THE MUSSMARTER</a><span>WE COME WITH BAGGAGE.</span></nav>'+content+'<footer>Stephen &amp; Katie · The MussMarter</footer></body></html>'
ordered=sorted(articles.values(),key=lambda a:a["date"],reverse=True)
cards=[]
for a in ordered:
    destination=OUT/a["path"]
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(shell(a["title"],'<main class="story"><a href="../../index.html">← All stories</a><p class="meta">'+html.escape(a["date"][:10])+'</p><h1>'+html.escape(a["title"])+'</h1><div class="story-content">'+a["html"]+'</div></main>',"../../"))
    photo='<img src="'+a["cover"]+'" alt="" loading="lazy">' if a["cover"] else ""
    cards.append('<a class="card" href="'+a["path"]+'">'+photo+'<p class="meta">'+html.escape(a["date"][:10])+'</p><h2>'+html.escape(a["title"])+'</h2><span>Read story →</span></a>')
(OUT/"index.html").write_text(shell("Our travels",'<header class="hero"><span class="eyebrow">Stephen &amp; Katie’s travel journal</span><h1>The MussMarter</h1><p class="intro">We come with baggage. The places we went, the things that happened, and the photographs we took along the way.</p></header><main class="wrap"><p class="meta">'+str(len(ordered))+' preserved stories</p><div class="cards">'+''.join(cards)+'</div></main>'))
(OUT/"migration-report.json").write_text(json.dumps({"story_count":len(ordered),"image_count":len(images),"failures":failures,"stories":[{k:v for k,v in a.items() if k!="html"} for a in ordered],"image_sources":images},indent=2,ensure_ascii=False))
print("RESULT",len(ordered),"stories,",len(images),"images,",len(failures),"failures")
if not ordered:raise SystemExit("No stories imported: check source structure before relying on output.")
