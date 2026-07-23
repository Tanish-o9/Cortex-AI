import { useEffect, useRef } from "react";

export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 3D Starfield settings
    const particleCount = 120;
    const particles = [];
    const fov = 400; // Field of view depth projection
    const maxDepth = 1000;

    // Mouse tracking for perspective tilt
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Initialize particles in 3D coordinate space
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * maxDepth,
        size: Math.random() * 2 + 1,
        color: i % 2 === 0 ? "rgba(99, 102, 241, " : "rgba(139, 92, 246, " // indigo or violet
      });
    }

    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX - width / 2) * 0.15;
      mouse.targetY = (e.clientY - height / 2) * 0.15;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Rotation angles in 3D space
    let angleY = 0.001;
    let angleX = 0.0005;

    const animate = () => {
      ctx.fillStyle = "rgba(13, 15, 20, 0.25)"; // Trail effect for motion blur
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse interpolation (ease-out lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Draw connections/constellations in 3D projected space
      ctx.strokeStyle = "rgba(99, 102, 241, 0.04)";
      ctx.lineWidth = 1;

      const projected = [];

      // Update particle coordinates
      particles.forEach((p) => {
        // Rotate Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate X axis
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Apply constant depth forward speed
        z2 -= 1.5;

        // Reset if too close or out of bounds
        if (z2 <= 0) {
          z2 = maxDepth;
          x1 = (Math.random() - 0.5) * 2000;
          y1 = (Math.random() - 0.5) * 2000;
        }

        p.x = x1;
        p.y = y1;
        p.z = z2;

        // Perspective 3D Projection
        const scale = fov / (fov + z2);
        const px = x1 * scale + width / 2 + mouse.x;
        const py = y1 * scale + height / 2 + mouse.y;

        // Calculate opacity based on depth
        const opacity = (1 - z2 / maxDepth) * 0.7;

        projected.push({ x: px, y: py, size: p.size * scale, color: p.color + opacity + ")", z: z2 });
      });

      // Draw projected stars
      projected.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Draw constellation mesh between close elements
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect if close in screen space and similar depth space
          if (dist < 90 && Math.abs(projected[i].z - projected[j].z) < 150) {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}
