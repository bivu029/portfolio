from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import json, os, secrets, shutil, uuid

app = FastAPI()

ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") if origin.strip()]
ALLOW_CREDENTIALS = os.getenv("ALLOW_CREDENTIALS", "false").lower() in ("1", "true", "yes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static / Uploads ─────────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
CV_DIR = os.path.join(STATIC_DIR, "cv")
IMAGE_DIR = os.path.join(STATIC_DIR, "images")
os.makedirs(CV_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── Config ──────────────────────────────────────────
DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "portfolio123")
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
active_tokens = set()

# ── Helpers ─────────────────────────────────────────
def read_data():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Data file not found")
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Data file corrupted: {exc.msg} at line {exc.lineno} column {exc.colno}"
        )

def write_data(data):
    backup_file = DATA_FILE + ".bak"
    if os.path.exists(DATA_FILE):
        shutil.copy2(DATA_FILE, backup_file)

    temp_file = DATA_FILE + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(temp_file, DATA_FILE)

def auth_check(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    if token not in active_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token

# ── Auth helpers ──────────────────────────────────────

def get_auth_config(data=None):
    if data is None:
        data = read_data()
    auth = data.get("auth")
    if not auth:
        return {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    return {
        "username": auth.get("username", ADMIN_USERNAME),
        "password": auth.get("password", ADMIN_PASSWORD)
    }


def save_auth_config(username: str, password: str):
    data = read_data()
    data["auth"] = {"username": username, "password": password}
    write_data(data)

# ── Auth ─────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class CredentialUpdateRequest(BaseModel):
    old_password: str
    new_username: Optional[str] = None
    new_password: Optional[str] = None

@app.post("/admin/login")
def login(req: LoginRequest):
    auth = get_auth_config()
    if req.username != auth["username"] or req.password != auth["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_hex(32)
    active_tokens.add(token)
    return {"token": token, "message": "Login successful"}

@app.post("/admin/logout")
def logout(token: str = Depends(auth_check)):
    active_tokens.discard(token)
    return {"message": "Logged out"}

@app.get("/admin/credentials")
def admin_get_credentials(token: str = Depends(auth_check)):
    auth = get_auth_config()
    return {"username": auth["username"]}

@app.put("/admin/credentials")
def update_credentials(payload: CredentialUpdateRequest, token: str = Depends(auth_check)):
    auth = get_auth_config()
    if payload.old_password != auth["password"]:
        raise HTTPException(status_code=401, detail="Old password is incorrect")

    update_username = payload.new_username.strip() if payload.new_username else auth["username"]
    update_password = payload.new_password.strip() if payload.new_password else ""

    if not update_password:
        raise HTTPException(status_code=400, detail="New password is required")
    if not update_username:
        raise HTTPException(status_code=400, detail="New username is required")

    save_auth_config(update_username, update_password)
    return {"message": "Credentials updated"}

# ── Public endpoints (read only) ─────────────────────
@app.get("/api/hero")
def get_hero():
    return read_data()["hero"]

@app.get("/api/about")
def get_about():
    return read_data()["about"]

@app.get("/api/contact")
def get_contact():
    return read_data().get("contact", {})

@app.get("/api/skills")
def get_skills():
    return read_data()["skills"]

@app.get("/api/projects")
def get_projects():
    return read_data()["projects"]

@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    data = read_data()
    project = next((p for p in data["projects"] if p["id"] == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def parse_iso_timestamp(timestamp: str):
    if not timestamp:
        return None
    if timestamp.endswith("Z"):
        timestamp = timestamp[:-1]
    return datetime.fromisoformat(timestamp)


def init_analytics_storage(data):
    analytics = data.setdefault("analytics", {})
    analytics.setdefault("page_views", [])
    analytics.setdefault("performance", {
        "status": "needs_improvement",
        "score": 66,
        "metrics": {
            "largest_contentful_paint": 2.5,
            "total_blocking_time": 152,
            "cumulative_layout_shift": 0.13
        },
        "issues": [
            "Hero image is large and delays first paint.",
            "Unused JavaScript is increasing load time.",
            "Static assets lack caching headers."
        ],
        "recommendations": [
            "Compress hero image and serve WebP.",
            "Lazy-load non-critical scripts.",
            "Add cache-control headers for static resources."
        ]
    })
    return analytics


def normalize_project(project):
    project["slider_active"] = bool(project.get("slider_active"))
    project["slider_images"] = project.get("slider_images") or []
    project["slider_aspect"] = project.get("slider_aspect") or "16 / 9"
    project["live_link_active"] = bool(project.get("live_link_active"))
    project["live_link"] = project.get("live_link") or ""
    project["stack"] = project.get("stack") or []
    project["approach"] = project.get("approach") or []
    project["insights"] = project.get("insights") or []
    project["desc"] = project.get("desc") or ""
    project["overview"] = project.get("overview") or ""
    project["problem"] = project.get("problem") or ""
    project["data"] = project.get("data") or ""
    project["architecture"] = project.get("architecture") or ""
    project["impact"] = project.get("impact") or ""
    project["tools"] = project.get("tools") or ""
    return project


def build_analytics_summary(page_views):
    now = datetime.utcnow()
    counts = {
        "today": 0,
        "last_7_days": 0,
        "last_15_days": 0,
        "monthly": 0,
        "last_3_months": 0,
        "last_6_months": 0,
        "last_12_months": 0,
        "total": len(page_views)
    }
    for view in page_views:
        timestamp = parse_iso_timestamp(view.get("timestamp", ""))
        if not timestamp:
            continue
        if timestamp.date() == now.date():
            counts["today"] += 1
        if timestamp >= now - timedelta(days=7):
            counts["last_7_days"] += 1
        if timestamp >= now - timedelta(days=15):
            counts["last_15_days"] += 1
        if timestamp >= now - timedelta(days=30):
            counts["monthly"] += 1
        if timestamp >= now - timedelta(days=90):
            counts["last_3_months"] += 1
        if timestamp >= now - timedelta(days=180):
            counts["last_6_months"] += 1
        if timestamp >= now - timedelta(days=365):
            counts["last_12_months"] += 1
    return counts


def build_source_summary(page_views):
    total = len(page_views)
    source_counts = {}
    for view in page_views:
        source = view.get("source") or "Direct"
        source_counts[source] = source_counts.get(source, 0) + 1
    sorted_sources = sorted(source_counts.items(), key=lambda item: item[1], reverse=True)
    return [
        {"source": source, "count": count, "share": count / total if total else 0}
        for source, count in sorted_sources
    ][:5]


class TrackEvent(BaseModel):
    path: str
    source: Optional[str] = "Direct"
    referrer: Optional[str] = None


@app.post("/api/track")
def track_page(event: TrackEvent):
    data = read_data()
    analytics = init_analytics_storage(data)
    analytics["page_views"].append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "path": event.path,
        "source": event.source or "Direct",
        "referrer": event.referrer or ""
    })
    write_data(data)
    return {"status": "ok"}


@app.get("/api/analytics")
def get_analytics():
    data = read_data()
    analytics = init_analytics_storage(data)
    visitors = build_analytics_summary(analytics["page_views"])
    sources = build_source_summary(analytics["page_views"])
    return {
        "visitors": visitors,
        "sources": sources
    }

@app.post("/admin/analytics/reset")
def reset_analytics(token: str = Depends(auth_check)):
    data = read_data()
    analytics = init_analytics_storage(data)
    analytics["page_views"] = []
    write_data(data)
    return {"message": "Analytics reset"}

# ── Admin: Hero ──────────────────────────────────────
@app.put("/admin/hero")
def update_hero(hero: dict, token: str = Depends(auth_check)):
    data = read_data()
    data["hero"] = hero
    write_data(data)
    return {"message": "Hero updated"}

# ── Admin: About ─────────────────────────────────────
@app.put("/admin/about")
def update_about(about: dict, token: str = Depends(auth_check)):
    data = read_data()
    data["about"] = about
    write_data(data)
    return {"message": "About updated"}

@app.get("/admin/contact")
def admin_get_contact(token: str = Depends(auth_check)):
    return read_data().get("contact", {})

@app.put("/admin/contact")
def update_contact(contact: dict, token: str = Depends(auth_check)):
    data = read_data()
    data["contact"] = contact
    write_data(data)
    return {"message": "Contact updated"}

@app.post("/admin/contact/upload")
def upload_cv(file: UploadFile = File(...), token: str = Depends(auth_check)):
    filename = f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
    dest = os.path.join(CV_DIR, filename)
    with open(dest, "wb") as out:
        out.write(file.file.read())
    return {"url": f"http://localhost:8000/static/cv/{filename}"}

@app.post("/admin/upload/image")
def upload_image(file: UploadFile = File(...), token: str = Depends(auth_check)):
    filename = f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
    dest = os.path.join(IMAGE_DIR, filename)
    with open(dest, "wb") as out:
        out.write(file.file.read())
    return {"url": f"http://localhost:8000/static/images/{filename}"}

@app.get("/api/skills-style")
def get_skills_style():
    data = read_data()
    return data.get("skills_style", {
        "section_title_color": "#0f172a",
        "section_title_size": "clamp(2rem, 4vw, 2.8rem)",
        "section_title_weight": "700",
        "section_title_style": "normal",
        "card_category_color": "#3f72af",
        "card_name_color": "#0f172a",
        "card_desc_color": "#475569",
        "card_pct_color": "#0f172a",
        "card_tag_color": "#0f172a"
    })

@app.put("/admin/skills-style")
def update_skills_style(style: dict, token: str = Depends(auth_check)):
    data = read_data()
    data["skills_style"] = style
    write_data(data)
    return style

@app.get("/api/projects-style")
def get_projects_style():
    data = read_data()
    return data.get("projects_style", {
        "section_title_color": "#0f172a",
        "section_title_size": "clamp(2rem, 4vw, 2.8rem)",
        "section_title_weight": "700",
        "section_title_style": "normal",
        "card_num_color": "#3f72af",
        "card_name_color": "#0f172a",
        "card_desc_color": "#475569",
        "card_stack_color": "#0f172a"
    })

@app.put("/admin/projects-style")
def update_projects_style(style: dict, token: str = Depends(auth_check)):
    data = read_data()
    data["projects_style"] = style
    write_data(data)
    return style

# ── Admin: Skills ─────────────────────────────────────
@app.get("/admin/skills")
def admin_get_skills(token: str = Depends(auth_check)):
    return read_data()["skills"]

@app.post("/admin/skills")
def create_skill(skill: dict, token: str = Depends(auth_check)):
    data = read_data()
    skill["id"] = str(uuid.uuid4())[:8]
    data["skills"].append(skill)
    write_data(data)
    return skill

@app.put("/admin/skills/{skill_id}")
def update_skill(skill_id: str, skill: dict, token: str = Depends(auth_check)):
    data = read_data()
    idx = next((i for i, s in enumerate(data["skills"]) if s["id"] == skill_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill["id"] = skill_id
    data["skills"][idx] = skill
    write_data(data)
    return skill

@app.delete("/admin/skills/{skill_id}")
def delete_skill(skill_id: str, token: str = Depends(auth_check)):
    data = read_data()
    data["skills"] = [s for s in data["skills"] if s["id"] != skill_id]
    write_data(data)
    return {"message": "Skill deleted"}

# ── Admin: Projects ───────────────────────────────────
@app.get("/admin/projects")
def admin_get_projects(token: str = Depends(auth_check)):
    return read_data()["projects"]

@app.post("/admin/projects")
def create_project(project: dict, token: str = Depends(auth_check)):
    data = read_data()
    if not project.get("id"):
        project["id"] = project.get("name", "project").lower().replace(" ", "-")[:30]
    project = normalize_project(project)
    project["num"] = f"PROJECT {str(len(data['projects']) + 1).zfill(3)}"
    data["projects"].append(project)
    write_data(data)
    return project

@app.put("/admin/projects/{project_id}")
def update_project(project_id: str, project: dict, token: str = Depends(auth_check)):
    data = read_data()
    idx = next((i for i, p in enumerate(data["projects"]) if p["id"] == project_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Project not found")
    project["id"] = project_id
    project = normalize_project(project)
    project["num"] = data["projects"][idx].get("num", f"PROJECT {str(idx + 1).zfill(3)}")
    data["projects"][idx] = project
    write_data(data)
    return project

@app.delete("/admin/projects/{project_id}")
def delete_project(project_id: str, token: str = Depends(auth_check)):
    data = read_data()
    data["projects"] = [p for p in data["projects"] if p["id"] != project_id]
    write_data(data)
    return {"message": "Project deleted"}
