/**
 * Content summary: A public developer portfolio for Anthony Baker with persisted profile, project, skill, writing, and contact data.
 * Design: The page is an asymmetric Circuit Fieldbook—deep teal technical cover, indexed documentation sections, chartreuse signals, and annotated project cards. On mobile, the index condenses into a menu while the content remains a single readable field-note stream. Interactions include smooth navigation, persisted contact submission, and an owner-only PDF resume upload that stores bytes in object storage and saves its reference in the database.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Cloud,
  Code2,
  Copy,
  Download,
  FileUp,
  Github,
  Linkedin,
  Loader2,
  Mail,
  Menu,
  Network,
  Phone,
  Send,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const heroImage = "/manus-storage/anthony-baker-fieldbook-hero_65ecc305.png";
const brandMark = "/manus-storage/anthony-baker-ab-mark_7b1275bb.png";

const navItems = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Build log" },
  { href: "#skills", label: "Toolkit" },
  { href: "#notes", label: "Field notes" },
  { href: "#contact", label: "Contact" },
];

function parseStack(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function SectionMarker({ index, label }: { index: string; label: string }) {
  return (
    <div className="section-marker" aria-label={label}>
      <span className="marker-index">{index}</span>
      <span className="marker-line" />
      <span className="marker-label">{label}</span>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [projectMediaFile, setProjectMediaFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectMediaInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const snapshotQuery = trpc.portfolio.snapshot.useQuery();
  const contactMutation = trpc.portfolio.contact.useMutation({
    onSuccess: () => {
      setForm({ name: "", email: "", message: "" });
      toast.success("Message logged. Anthony will see it in the contact inbox.");
    },
    onError: error => toast.error(error.message || "The message could not be saved. Please try again."),
  });
  const resumeMutation = trpc.portfolio.uploadResume.useMutation({
    onSuccess: async () => {
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await utils.portfolio.snapshot.invalidate();
      toast.success("Resume stored securely and linked to the portfolio.");
    },
    onError: error => toast.error(error.message || "The resume could not be stored."),
  });
  const projectMediaMutation = trpc.portfolio.uploadProjectMedia.useMutation({
    onSuccess: async () => {
      setProjectMediaFile(null);
      if (projectMediaInputRef.current) projectMediaInputRef.current.value = "";
      await utils.portfolio.snapshot.invalidate();
      toast.success("Project image stored and attached to the selected build log.");
    },
    onError: error => toast.error(error.message || "The project image could not be stored."),
  });

  const snapshot = snapshotQuery.data;
  const profile = snapshot?.profile;
  const projects = snapshot?.projects ?? [];
  const skills = snapshot?.skills ?? [];
  const articles = snapshot?.articles ?? [];
  const groupedSkills = useMemo(() => {
    return skills.reduce<Record<string, typeof skills>>((groups, skill) => {
      (groups[skill.category] ??= []).push(skill);
      return groups;
    }, {});
  }, [skills]);
  const isOwner = user?.role === "admin";

  const closeMenu = () => setMenuOpen(false);
  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    contactMutation.mutate(form);
  };
  const uploadResume = async () => {
    if (!uploadedFile) {
      toast.message("Choose a PDF resume first.");
      return;
    }
    if (uploadedFile.type !== "application/pdf") {
      toast.error("Only PDF files can be stored as the public resume.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read the selected file."));
      reader.readAsDataURL(uploadedFile);
    });
    resumeMutation.mutate({
      fileName: uploadedFile.name,
      mimeType: "application/pdf",
      contentBase64: dataUrl.split(",")[1] ?? "",
    });
  };
  const uploadProjectMedia = async () => {
    if (!projectMediaFile || !projectId) {
      toast.message("Choose a project and a PNG, JPEG, or WebP image first.");
      return;
    }
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(projectMediaFile.type)) {
      toast.error("Project media must be a PNG, JPEG, or WebP image.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read the selected image."));
      reader.readAsDataURL(projectMediaFile);
    });
    projectMediaMutation.mutate({
      projectId: Number(projectId),
      fileName: projectMediaFile.name,
      mimeType: projectMediaFile.type as "image/png" | "image/jpeg" | "image/webp",
      contentBase64: dataUrl.split(",")[1] ?? "",
    });
  };
  const copyEmail = async () => {
    if (!profile?.email) return;
    try {
      await navigator.clipboard.writeText(profile.email);
      toast.success("Email address copied.");
    } catch {
      toast.error("Could not copy the email address.");
    }
  };

  if (snapshotQuery.isLoading) {
    return (
      <main className="loading-sheet">
        <Loader2 className="h-5 w-5 animate-spin text-[#a6ff4d]" />
        <span>Opening fieldbook…</span>
      </main>
    );
  }

  if (snapshotQuery.isError || !profile) {
    return (
      <main className="loading-sheet error-sheet">
        <span className="error-code">ERR / PORTFOLIO-01</span>
        <h1>The fieldbook is temporarily unavailable.</h1>
        <p>Please reload the page. If the issue remains, contact Anthony directly at Anthony@bakerinfo.org.</p>
      </main>
    );
  }

  return (
    <div className="fieldbook-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Anthony Baker home">
          <img src={brandMark} alt="Anthony Baker AB signal mark" />
          <span className="brand-type">A.BAKER<span>/SYS</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <a className="nav-contact" href="#contact">Start a conversation <ArrowDownRight size={15} /></a>
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map(item => <a onClick={closeMenu} key={item.href} href={item.href}>{item.label}<ArrowDownRight size={16} /></a>)}
        </nav>
      )}

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <img className="hero-image" src={heroImage} alt="Network hardware and field notebook on a technical workbench" />
          <div className="hero-shade" />
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-content">
            <p className="eyebrow light"><span className="pulse-dot" /> DFW / TX · FIELD NOTE 0001</p>
            <h1 id="hero-title">{profile.publicName.split(" ").map((part, index) => <span key={part} className={index === 1 ? "lime-name" : ""}>{part} </span>)}</h1>
            <p className="hero-headline">{profile.headline}</p>
            <p className="hero-intro">{profile.introduction}</p>
            <div className="hero-actions">
              <a className="button primary" href="#projects">Inspect the work <ArrowDownRight size={18} /></a>
              <a className="button ghost" href={profile.githubUrl} target="_blank" rel="noreferrer"><Github size={18} /> GitHub profile</a>
            </div>
            <div className="tech-row" aria-label="Technical focus areas">
              <span><Network size={17} /> Networks</span><span><ShieldCheck size={17} /> Security</span><span><Cloud size={17} /> Cloud</span><span><Code2 size={17} /> Build systems</span>
            </div>
          </div>
          <div className="hero-coordinate" aria-hidden="true">
            <span>SECTOR / 32.7767° N</span><span>96.7970° W</span><span>STATUS / BUILDING</span>
          </div>
        </section>

        <section id="about" className="section about-section">
          <div className="section-side"><SectionMarker index="01" label="PROFILE" /></div>
          <div className="section-body about-copy">
            <p className="big-copy">I’m most interested in the space where <em>systems, security, and useful software</em> meet.</p>
            <div className="about-grid">
              <p>From small homelab experiments to application prototypes, I keep a practical eye on how technology behaves in the real world. I like the moment when a scattered idea becomes a working system that somebody can actually use.</p>
              <div className="annotation-card">
                <span className="annotation-label">CURRENT OPERATING MODE</span>
                <strong>Learn openly. Build carefully. Keep the notes.</strong>
                <span className="annotation-axis">01 / INFRA &nbsp;&nbsp; 02 / SECURITY &nbsp;&nbsp; 03 / SOFTWARE</span>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="section projects-section">
          <div className="section-side"><SectionMarker index="02" label="BUILD LOG" /></div>
          <div className="section-body">
            <div className="section-heading-row">
              <div><p className="eyebrow">SELECTED REPOSITORIES</p><h2>Systems under <em>inspection.</em></h2></div>
              <p className="section-note">A curated view of public work. Repository links remain the source of truth.</p>
            </div>
            <div className="project-grid">
              {projects.map((project, index) => {
                const stack = parseStack(project.stack);
                return (
                  <article className={`project-card project-${(index % 5) + 1}`} key={project.id}>
                    {project.imageUrl && <img className="project-image" src={project.imageUrl} alt="" />}
                    <div className="card-grain" aria-hidden="true" />
                    <div className="project-card-top"><span>{String(index + 1).padStart(2, "0")}/05</span><span className="project-status"><i />{project.status}</span></div>
                    <div className="project-card-main">
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <div className="tag-row">{stack.map(tag => <span key={tag}>{tag}</span>)}</div>
                    </div>
                    <div className="project-links">
                      <a href={project.repoUrl} target="_blank" rel="noreferrer">Open repository <Github size={15} /></a>
                      {project.demoUrl ? <a href={project.demoUrl} target="_blank" rel="noreferrer">Live demo <ArrowUpRight size={15} /></a> : <span>Demo in lab</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="skills" className="section skills-section">
          <div className="section-side"><SectionMarker index="03" label="TOOLKIT" /></div>
          <div className="section-body">
            <div className="section-heading-row"><div><p className="eyebrow">WORKING TOOLKIT</p><h2>Measured by <em>practice.</em></h2></div><p className="section-note">A self-assessed map of where I spend time, not a substitute for curiosity.</p></div>
            <div className="skill-matrix">
              {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                <div className="skill-group" key={category}>
                  <h3>{category}</h3>
                  {categorySkills.map(skill => (
                    <div className="skill-row" key={skill.id}>
                      <div className="skill-name"><span>{skill.name}</span><small>{skill.description}</small></div>
                      <div className="meter-wrap"><div className="meter" role="progressbar" aria-label={`${skill.name} self-assessed proficiency`} aria-valuenow={skill.proficiency} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${skill.proficiency}%` }} /></div><b>{skill.proficiency}</b></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="notes" className="section notes-section">
          <div className="section-side"><SectionMarker index="04" label="FIELD NOTES" /></div>
          <div className="section-body">
            <div className="section-heading-row"><div><p className="eyebrow">WRITING / PROJECT NOTES</p><h2>Notes from the <em>bench.</em></h2></div><p className="section-note">Short technical reflections connected to the work in progress.</p></div>
            <div className="note-list">
              {articles.map((article, index) => (
                <a className="note-card" href={article.articleUrl ?? "#"} target={article.articleUrl ? "_blank" : undefined} rel="noreferrer" key={article.id}>
                  <span className="note-number">NOTE {String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{article.title}</h3><p>{article.excerpt}</p></div>
                  <span className="note-meta">{article.readTime ?? "Read"}<ArrowUpRight size={18} /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="section-side"><SectionMarker index="05" label="CONTACT" /></div>
          <div className="section-body">
            <div className="contact-layout">
              <div className="contact-lead">
                <p className="eyebrow light">OPEN CHANNEL</p>
                <h2>Have a system worth <em>tracing?</em></h2>
                <p>Have an infrastructure problem, a useful idea, or a project that needs a patient technical eye? Send a note. It is persisted privately in my contact inbox.</p>
                <div className="contact-details">
                  <a href={`mailto:${profile.email}`}><Mail size={17} /> {profile.email}</a>
                  <button type="button" onClick={copyEmail} aria-label="Copy email address"><Copy size={16} /> Copy address</button>
                  {profile.phone && <a href={`tel:${profile.phone.replace(/[^0-9+]/g, "")}`}><Phone size={17} /> {profile.phone}</a>}
                  {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={17} /> LinkedIn</a>}
                </div>
                <div className="resume-box">
                  <div><span className="resume-label">PUBLIC RESUME</span><strong>{snapshot?.resume ? "Ready to download" : "Available on request"}</strong></div>
                  {snapshot?.resume ? <a className="button lime-small" href={snapshot.resume.url} target="_blank" rel="noreferrer"><Download size={16} /> Download PDF</a> : <a className="button lime-small" href={`mailto:${profile.email}?subject=Resume%20request`}><Mail size={16} /> Request resume</a>}
                </div>
              </div>
              <form className="contact-form" onSubmit={submitContact}>
                <label><span>Name</span><input required minLength={2} maxLength={120} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Your name" /></label>
                <label><span>Email</span><input required type="email" maxLength={320} value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} placeholder="you@example.com" /></label>
                <label><span>Message</span><textarea required minLength={12} maxLength={4000} value={form.message} onChange={event => setForm(current => ({ ...current, message: event.target.value }))} placeholder="Tell me what you are working on…" rows={6} /></label>
                <button className="button form-submit" type="submit" disabled={contactMutation.isPending}>{contactMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} {contactMutation.isPending ? "Saving message…" : "Send to contact inbox"}</button>
                <p className="form-note"><Check size={14} /> The message is stored in the site database for private follow-up.</p>
              </form>
            </div>

            {isOwner && (
              <aside className="owner-panel" aria-label="Owner resume storage control">
                <div><span className="eyebrow">PRIVATE OWNER CONTROL / STORAGE</span><h3>Publish a new resume PDF</h3><p>This control is visible only to the site owner. The file is stored in private object storage while the portfolio database retains only its secure reference.</p></div>
                <div className="owner-upload">
                  <input ref={fileInputRef} id="resume-upload" type="file" accept="application/pdf" onChange={event => setUploadedFile(event.target.files?.[0] ?? null)} />
                  <label htmlFor="resume-upload"><FileUp size={17} /> {uploadedFile ? uploadedFile.name : "Choose PDF"}</label>
                  <button type="button" onClick={uploadResume} disabled={resumeMutation.isPending}>{resumeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Server size={16} />} Store & publish</button>
                </div>
                <div className="owner-upload project-media-upload">
                  <select value={projectId} onChange={event => setProjectId(event.target.value)} aria-label="Project to update">
                    <option value="">Attach image to…</option>
                    {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
                  </select>
                  <input ref={projectMediaInputRef} id="project-media-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setProjectMediaFile(event.target.files?.[0] ?? null)} />
                  <label htmlFor="project-media-upload"><FileUp size={17} /> {projectMediaFile ? projectMediaFile.name : "Choose project image"}</label>
                  <button type="button" onClick={uploadProjectMedia} disabled={projectMediaMutation.isPending}>{projectMediaMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Server size={16} />} Store & attach</button>
                </div>
              </aside>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer"><span>© {new Date().getFullYear()} ANTHONY BAKER</span><span>BUILT AS A FIELD NOTE · {profile.location}</span><a href={profile.githubUrl} target="_blank" rel="noreferrer">DANDY-S00 <ArrowUpRight size={14} /></a></footer>
    </div>
  );
}
