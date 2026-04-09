/* ============================================================
   TASKFLOW — Electric Lightning Background (Canvas)
   Lightweight animated lightning + particle system
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Lightning bolt generator ──────────────────────────── */
  class Lightning {
    constructor() { this.reset(); }

    reset() {
      this.x = Math.random() * W;
      this.y = 0;
      this.segments = [];
      this.alpha = 0;
      this.fadeIn = true;
      this.life = 40 + Math.random() * 30;
      this.age = 0;
      this.color = Math.random() > 0.5
        ? `rgba(0, 212, 255, ALPHA)`    // cyan
        : `rgba(168, 130, 255, ALPHA)`; // purple
      this._build();
    }

    _build() {
      let x = this.x, y = this.y;
      const steps = 8 + Math.floor(Math.random() * 10);
      const stepH = (H * .7) / steps;
      this.segments = [];

      for (let i = 0; i < steps; i++) {
        const nx = x + (Math.random() - 0.5) * 120;
        const ny = y + stepH + Math.random() * 20;
        this.segments.push({ x1: x, y1: y, x2: nx, y2: ny });
        x = nx; y = ny;
      }
    }

    update() {
      this.age++;
      if (this.fadeIn) {
        this.alpha = Math.min(this.alpha + 0.08, 0.6);
        if (this.alpha >= 0.6) this.fadeIn = false;
      } else {
        this.alpha -= 0.015;
      }
      return this.alpha > 0;
    }

    draw() {
      const a = this.alpha;
      const col = this.color.replace('ALPHA', a.toFixed(2));
      const glow = this.color.replace('ALPHA', (a * 0.4).toFixed(2));

      // Glow layer
      ctx.strokeStyle = glow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const s of this.segments) {
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
      }
      ctx.stroke();

      // Core line
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const s of this.segments) {
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
      }
      ctx.stroke();
    }
  }

  /* ── Floating particles ────────────────────────────────── */
  class Particle {
    constructor() { this.reset(); }

    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.pulse = Math.random() * Math.PI * 2;
      this.isBlue = Math.random() > 0.4;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += 0.02;

      // Wrap around
      if (this.x < 0) this.x = W;
      if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H;
      if (this.y > H) this.y = 0;
    }

    draw() {
      const a = this.alpha + Math.sin(this.pulse) * 0.15;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.isBlue
        ? `rgba(0, 212, 255, ${a.toFixed(2)})`
        : `rgba(192, 132, 252, ${a.toFixed(2)})`;
      ctx.fill();
    }
  }

  /* ── Scene setup ───────────────────────────────────────── */
  const particles = Array.from({ length: 60 }, () => new Particle());
  let lightnings = [];
  let frameCount = 0;

  function animate() {
    ctx.clearRect(0, 0, W, H);
    frameCount++;

    // Spawn lightning every ~80 frames (≈1.3s at 60fps)
    if (frameCount % 80 === 0 || (Math.random() < 0.008)) {
      if (lightnings.length < 3) {
        lightnings.push(new Lightning());
      }
    }

    // Update & draw lightnings
    lightnings = lightnings.filter(l => {
      const alive = l.update();
      if (alive) l.draw();
      return alive;
    });

    // Particles
    for (const p of particles) {
      p.update();
      p.draw();
    }

    requestAnimationFrame(animate);
  }

  animate();
})();
