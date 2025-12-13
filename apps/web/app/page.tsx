"use client";
import { useRef, useEffect, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);

  const fontSizeRef = useRef(200);
  const fontSizeTargetRef = useRef(14);
  const circleSizeRef = useRef(230);
  const targetSizeRef = useRef(230);

  const isMouseOverCircle = (
    mouseX: number,
    mouseY: number,
    circleX: number,
    circleY: number,
    radius: number
  ) => {
    const dx = mouseX - circleX;
    const dy = mouseY - circleY;
    return dx * dx + dy * dy <= radius * radius;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId: number;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const centerX = () => window.innerWidth / 2;
    const centerY = () => window.innerHeight / 2;
    const minSize = 230;
    const maxSize = 300;
    const glowSizeMultiplier = 1.5;

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const isOver = isMouseOverCircle(
        mouseX,
        mouseY,
        centerX(),
        centerY(),
        circleSizeRef.current
      );
      setHovered(isOver);
    };

    const handleClick = () => {
      if (
        isMouseOverCircle(
          mouseX,
          mouseY,
          centerX(),
          centerY(),
          circleSizeRef.current
        )
      ) {
        window.location.href = "/timeline";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { width, height } = canvas;
      const centerXPos = width / 2;
      const centerYPos = height / 2;

      ctx.strokeStyle = "rgba(100, 75, 89, 1)";
      ctx.lineWidth = 20;
      ctx.beginPath();
      const amplitude = 40;
      const frequency = 0.02;
      const speed = 0.001;
      const time = Date.now() * speed;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * frequency + time) * amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      const currentSize = circleSizeRef.current;
      const targetSize = hovered ? maxSize : minSize;
      circleSizeRef.current += (targetSize - currentSize) * 0.1;

      // Draw glow
      const glowRadius = circleSizeRef.current * glowSizeMultiplier;
      const glowGradient = ctx.createRadialGradient(
        centerXPos,
        centerYPos,
        0,
        centerXPos,
        centerYPos,
        glowRadius
      );
      const glowColor = hovered
        ? "rgba(255, 255, 255, 0.5)"
        : "rgba(255, 255, 255, 0.2)";
      glowGradient.addColorStop(0, glowColor);
      glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);

      // circle
      ctx.beginPath();
      ctx.arc(centerXPos, centerYPos, circleSizeRef.current, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 40, ${hovered ? 1 : 0.7})`;
      ctx.fill();

      const desiredSineSize = hovered ? 50 : 24;
      fontSizeRef.current += (desiredSineSize - fontSizeRef.current) * 0.1;

      ctx.font = `bold ${fontSizeRef.current}px Times New Roman`;
      ctx.fillStyle = `${hovered ? "White" : "Black"}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.createLinearGradient(0, 0, 100, 100);
      ctx.fillText("SYNsin", centerXPos, centerYPos);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hovered]);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
      />

      <div style={{ padding: "20px", color: "#fff" }}>
        <h1>Welcome to SINsyn</h1>
        <h6> Made by Sai Pena</h6>
        <p>Hover over the circle and click to start editing.</p>
      </div>
    </div>
  );
}
