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
CSS="[hidden]{display:none!important}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f1e5c9;color:#253d38;font:18px/1.75 Georgia,serif}a{color:inherit}img{max-width:100%}button,select{font:inherit}button{cursor:pointer}.site-nav{background:#24443d;color:#f6e8c6;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:17px max(20px,4vw)}.site-nav a{color:inherit;text-decoration:none}.wordmark{font:950 clamp(21px,3vw,30px)/1 Arial,sans-serif;letter-spacing:-.07em}.wordmark span{color:#f4bc62}.nav-note{font:800 11px Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase}.poster-hero{background:#eab15e;padding:22px max(18px,4vw) 25px}.poster-inner{border:5px solid #253d38;padding:clamp(20px,4vw,50px) clamp(15px,3vw,40px);text-align:center;position:relative;overflow:hidden}.eyebrow,.meta{font:900 11px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}.hero-title{font:1000 clamp(56px,11vw,154px)/.84 Arial,sans-serif;letter-spacing:-.09em;text-transform:uppercase;margin:22px auto 28px;max-width:1400px}.hero-title em{color:#c74d32;font-style:normal}.hero-photo{position:relative;height:clamp(220px,44vw,590px);border:4px solid #253d38;overflow:hidden;background:#73978f}.hero-photo img{width:100%;height:100%;object-fit:cover;filter:saturate(.92) contrast(1.06);animation:hero-in 1.3s ease-out both}.hero-photo figcaption{position:absolute;bottom:0;left:0;right:0;padding:15px;background:#253d38;color:#f8ead0;font:900 12px Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase}.round-stamp{position:absolute;z-index:2;right:-13px;top:-16px;display:grid;place-items:center;background:#c74d32;color:#fff3d7;width:105px;height:105px;border:4px dashed #f8d29b;border-radius:50%;font:900 12px/1.15 Arial,sans-serif;transform:rotate(12deg)}.hero-foot{display:flex;justify-content:space-between;gap:15px;padding:24px 0 0;font:900 11px Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase}.ticker{padding:12px;background:#c74d32;color:#f8ecd4;text-align:center;font:900 12px Arial,sans-serif;letter-spacing:.1em}.archive{padding:70px max(20px,4vw);max-width:1500px;margin:auto}.archive-title{font:1000 clamp(40px,7vw,90px)/.91 Arial,sans-serif;letter-spacing:-.07em;text-transform:uppercase;margin:12px 0 35px}.archive-head{display:flex;align-items:end;justify-content:space-between;flex-wrap:wrap;gap:12px}.filters{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 30px}.filter{border:2px solid #253d38;background:transparent;padding:9px 15px;text-transform:uppercase;font:900 11px Arial,sans-serif;letter-spacing:.055em;border-radius:40px;transition:background .2s,color .2s}.filter:hover,.filter.active{background:#253d38;color:#fff0d1}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px}.card{display:block;min-width:0;background:#f8ecd2;color:inherit;text-decoration:none;border:3px solid #253d38;box-shadow:6px 6px 0 #253d38;transition:transform .3s,box-shadow .3s}.card:hover{transform:translateY(-7px);box-shadow:6px 13px 0 #253d38}.card-photo{height:auto;aspect-ratio:4/3;background:#73978f;overflow:hidden;position:relative;border-bottom:3px solid #253d38}.card-photo img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .6s}.card:hover img{transform:scale(1.065)}.card-body{padding:20px}.card .meta{color:#b74930}.card h2{font:950 clamp(21px,2.6vw,36px)/1.04 Arial,sans-serif;letter-spacing:-.055em;text-transform:uppercase;margin:12px 0 18px}.card-arrow{font:900 26px Arial,sans-serif}.archive-empty{font:800 15px Arial,sans-serif}.story-mast{background:#edbd6f;border-bottom:5px solid #253d38;padding:42px max(20px,5vw) 50px}.back{display:inline-block;border:2px solid #253d38;padding:10px 15px;background:#f8ecd2;text-decoration:none;font:900 12px Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em}.story-mast h1{font:950 clamp(45px,8vw,115px)/.9 Arial,sans-serif;letter-spacing:-.07em;text-transform:uppercase;max-width:1300px;margin:25px 0}.story-meta{display:flex;flex-wrap:wrap;gap:15px;font:900 11px Arial,sans-serif;text-transform:uppercase;letter-spacing:.1em}.story-cover{height:clamp(240px,53vw,680px);background:#6d8b85;overflow:hidden;border-bottom:5px solid #253d38}.story-cover img{width:100%;height:100%;object-fit:cover}.story{max-width:900px;margin:auto;padding:65px 25px 95px}.story-content{font:20px/1.82 Georgia,serif;overflow-wrap:anywhere}.story-content p{margin:0 0 1.5em}.story-content img{max-width:100%;height:auto;display:block;margin:32px auto}.story-content figure,.story-content .wp-block-image{max-width:100%;margin:35px auto}.story-content figcaption,.story-content .wp-caption-text{font:14px/1.5 Arial,sans-serif;text-align:center;color:#59695d}.story-content .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.story-content .gallery img{margin:0}.story-content iframe{max-width:100%}.end-link{margin-top:60px}.footer{background:#24443d;color:#f8ead0;text-align:center;padding:30px 20px;font:900 12px Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase}.reveal{animation:fade-up .7s ease-out both}@keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes hero-in{from{transform:scale(1.06);opacity:.3}to{transform:scale(1);opacity:1}}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.nav-note{display:none}.poster-inner{border-width:3px}.hero-title{font-size:clamp(48px,11.2vw,77px);margin:22px auto}.hero-photo{border-width:3px}.round-stamp{width:74px;height:74px;right:-11px;top:-12px;font-size:9px}.hero-foot{font-size:9px}.ticker{font-size:10px}.archive{padding:48px 18px}.grid{grid-template-columns:1fr;gap:24px}.card h2{font-size:28px}.story-mast h1{font-size:clamp(38px,11vw,66px)}.story{padding:40px 20px 75px}.story-content{font-size:18px}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
(OUT/"style.css").write_text(CSS,encoding="utf-8")
def shell(title,main,up=""):
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="robots" content="noindex,nofollow,noarchive">'
            '<title>'+html.escape(title)+' | The MussMarter</title>'
            '<link rel="stylesheet" href="'+up+'style.css"></head><body>'
            '<nav class="site-nav"><a class="wordmark" href="'+up+'index.html">the mussmarter<span>.</span></a>'
            '<span class="nav-note">STEPHEN + KATIE / EST. 2014</span></nav>'
            +main+'<footer class="footer">THE MUSSMARTER · WE COME WITH BAGGAGE · A PERSONAL ARCHIVE</footer></body></html>')
cards=[]
report=[]
for i,p in enumerate(sorted(posts,key=lambda p:p["date"],reverse=True)):
    title=p["title"]; url=p["url"]
    content,photos=clean_content(p["body"],url)
    path="stories/"+str(i+1).zfill(3)+"-"+slug(title)
    dest=OUT/path
    dest.mkdir(parents=True,exist_ok=True)
    categories=p.get("categories",[])
    # Keep category association in the index; do not alter original stories.
    country=next((c for c in categories if c.lower() in ("thailand","laos","vietnam","cambodia","india","indonesia","malaysia","michigan","new york","usa")),categories[0] if categories else "The journey")
    story_header=('<header class="story-mast"><a class="back" href="../../index.html">← ALL STORIES</a>'
       '<p class="meta" style="margin-top:32px">'+html.escape(country)+' / '+html.escape(p["date"][:10])+'</p>'
       '<h1>'+html.escape(title)+'</h1><div class="story-meta"><span>'+str(len(photos))+' photographs</span><span>Original travel journal</span></div></header>')
    coverblock=('<div class="story-cover"><img src="../../'+html.escape(photos[0],quote=True)+'" alt="" loading="eager"></div>') if photos else ""
    story=story_header+coverblock+'<main class="story"><div class="story-content">'+content+'</div><div class="end-link"><a class="back" href="../../index.html">← MORE STORIES</a></div></main>'
    (dest/"index.html").write_text(shell(title,story,"../../"),encoding="utf-8")
    photo=('<img src="'+html.escape(photos[0],quote=True)+'" loading="lazy" alt="">') if photos else ""
    cards.append('<a class="card reveal" data-country="'+html.escape(country.lower(),quote=True)+'" href="'+path+'/index.html">'
        '<div class="card-photo">'+photo+'</div><section class="card-body">'
        '<p class="meta">'+html.escape(country)+' / '+html.escape(p["date"][:10])+'</p>'
        '<h2>'+html.escape(title)+'</h2><span class="card-arrow" aria-label="Read story">↗</span></section></a>')
    report.append({"title":title,"date":p["date"],"original_url":url,"local_path":path+"/index.html",
                   "photos":len(photos),"categories":categories,"image_paths":photos})
    print("Imported",i+1,title,"photos",len(photos),flush=True)
    time.sleep(.08)
countries=sorted(set((next((x for x in a["categories"] if x.lower() in ("thailand","laos","vietnam","cambodia","india","indonesia","malaysia","michigan","new york","usa")),a["categories"][0] if a["categories"] else "The journey")).lower() for a in report))
filters='<button class="filter active" type="button" data-filter="all">All destinations</button>'+''.join('<button class="filter" type="button" data-filter="'+html.escape(c,quote=True)+'">'+html.escape(c.title())+'</button>' for c in countries)
lead=next((a for a in report if a["image_paths"]),None)
hero_image=('<img src="'+html.escape(lead["image_paths"][0],quote=True)+'" alt="Original MussMarter travel photograph">') if lead else ""
script="""<script>
(()=>{const buttons=[...document.querySelectorAll('[data-filter]')];const cards=[...document.querySelectorAll('[data-country]')];const count=document.getElementById('shown-count');buttons.forEach(btn=>btn.addEventListener('click',()=>{const selected=btn.dataset.filter;buttons.forEach(x=>{x.classList.toggle('active',x===btn);x.setAttribute('aria-pressed',String(x===btn))});let n=0;cards.forEach(card=>{const show=selected==='all'||card.dataset.country===selected;card.hidden=!show;if(show)n++});count.textContent=n+' STORIES';}));})();
</script>"""
main=('<header class="poster-hero"><div class="poster-inner"><p class="eyebrow">STEPHEN + KATIE · PERSONAL TRAVEL JOURNAL · EST. 2014</p>'
    '<h1 class="hero-title">WE COME<br>WITH <em>BAGGAGE.</em></h1>'
    '<figure class="hero-photo"><span class="round-stamp">GOOD TIMES<br>BAD MAPS</span>'+hero_image
    '<figcaption>THE PLACES WE WENT. THE STORIES WE KEPT.</figcaption></figure>'
    '<div class="hero-foot"><span>NO GUIDEBOOK REQUIRED</span><span>SCROLL TO EXPLORE ↓</span></div></div></header>'
    '<div class="ticker">✳ MILES TRAVELLED &nbsp; ◆ &nbsp; STORIES COLLECTED &nbsp; ✳ &nbsp; MEMORIES KEPT &nbsp; ◆ &nbsp; WE COME WITH BAGGAGE</div>'
    '<main class="archive" id="stories"><div class="archive-head"><div><p class="eyebrow">01 / THE ORIGINAL ARCHIVE</p>'
    '<h2 class="archive-title">POSTCARDS<br>FROM THE ROAD.</h2></div><p class="meta" id="shown-count">'+str(len(report))+' STORIES</p></div>'
    '<div class="filters" aria-label="Filter by destination">'+filters+'</div><div class="grid">'+''.join(cards)+'</div></main>'+script)
(OUT/"index.html").write_text(shell("We Come With Baggage",main),encoding="utf-8")
(OUT/"migration-report.json").write_text(json.dumps({"source":ROOT,"post_count":len(report),
   "downloaded_images":len(image_cache),"failures":failures,"posts":report},ensure_ascii=False,indent=2),encoding="utf-8")
print("COMPLETE:",len(report),"posts,",len(image_cache),"images,",len(failures),"failures",flush=True)
