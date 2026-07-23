import { useEffect, useRef } from "react";

export default function Globe3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    const width = (canvas.width = 160);
    const height = (canvas.height = 160);

    // Generate points on a sphere (Fibonacci lattice)
    const count = 180;
    const radius = 55;
    const fov = 150;
    const points = [];

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      points.push({
        x: Math.cos(theta) * Math.sin(phi) * radius,
        y: Math.sin(theta) * Math.sin(phi) * radius,
        z: Math.cos(phi) * radius
      });
    }

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      mouseX = x * 0.005;
      mouseY = y * 0.005;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    let angleX = 0.006;
    let angleY = 0.008;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Add interactive rotation speed from mouse coords
      const currentAngleX = angleX + mouseY * 0.2;
      const currentAngleY = angleY + mouseX * 0.2;

      const cosX = Math.cos(currentAngleX);
      const sinX = Math.sin(currentAngleX);
      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);

      // Draw projected points
      const projected = [];

      points.forEach((p) => {
        // Rotate Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate X axis
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Save rotated coordinates
        p.x = x1;
        p.y = y1;
        p.z = z2;

        // Project to 2D
        const scale = fov / (fov + z2);
        const px = x1 * scale + width / 2;
        const py = y1 * scale + height / 2;

        // Depth color mapping (Indigo/Cyan)
        const depth = (radius - z2) / (radius * 2); // 0 (back) to 1 (front)
        const opacity = depth * 0.7 + 0.15;
        const r = Math.floor(99 + (139 - 99) * (1 - depth));
        const g = Math.floor(102 + (92 - 102) * (1 - depth));
        const b = Math.floor(241 + (246 - 241) * (1 - depth));

        projected.push({
          x: px,
          y: py,
          size: Math.max(0.5, scale * 1.5),
          color: `rgba(${r}, ${g}, ${b}, ${opacity})`,
          z: z2
        });
      });

      // Sort by depth (Z-buffer) for realistic rendering order
      projected.sort((a, b) => b.z - a.z);

      // Render projected points
      projected.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative group flex justify-center items-center">
      {/* 3D Orb canvas */}
      <canvas
        ref={canvasRef}
        className="cursor-pointer relative z-10 transition-transform duration-500 group-hover:scale-110"
      />
      {/* Background glow pulse */}
      <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-indigo-500/10 blur-xl animate-pulse -z-0 pointer-events-none" />
    </div>
  );
}
