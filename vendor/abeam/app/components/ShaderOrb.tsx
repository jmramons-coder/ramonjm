"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./shader-orb.module.css";

const PALETTES: Record<string, readonly [string, string, string]> = {
  blue: ["#d4eeff", "#2787f5", "#075cc4"],
  orange: ["#ffdbab", "#e86c29", "#653628"],
  green: ["#d9f0d2", "#39a7ad", "#153f55"],
  violet: ["#ffe1ca", "#b894d4", "#515997"],
  pearl: ["#f7f5ed", "#d0d9d3", "#91aaa9"],
};
const VERTEX = `attribute vec2 position; varying vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT = `precision highp float;
varying vec2 uv; uniform vec2 resolution; uniform float time;
uniform float grainAmount; uniform float motionSpeed; uniform float fieldShape; uniform float smoothEdge;
uniform vec3 lightColor; uniform vec3 midColor; uniform vec3 darkColor;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(9.2,3.7,5.1);a*=.5;}return v;}
void main(){vec2 p=(uv-.5)*2.;float r=dot(p,p);if(fieldShape<.5 && r>1.)discard;
vec3 n=fieldShape>.5 ? vec3(p*.65,1.) : vec3(p,sqrt(max(0.,1.-r)));float t=time*motionSpeed;
vec3 q=n*1.35+vec3(t,-t*.35,t*.4);
vec3 warp=vec3(fbm(q+vec3(4.3,1.7,8.2)),fbm(q+vec3(1.2,7.4,2.1)),fbm(q+vec3(8.1,4.7,1.8)));
float flow=fbm(q+warp*1.6);float band=sin(n.x*1.5+n.y*1.7+flow*3.5+t)*.5+.5;
vec3 color=mix(midColor,lightColor,smoothstep(.2,.9,band)*.8);
float diffuse=dot(n,normalize(vec3(-.45,.7,1.)));
color=mix(color,darkColor,(1.-n.z)*.38+(1.-max(0.,diffuse))*.2);
color*=.85+.18*max(0.,diffuse);
float spec=pow(max(0.,dot(n,normalize(vec3(-.5,.65,1.4)))),13.);color+=lightColor*spec*.14;
float grain=hash(vec3(gl_FragCoord.xy,17.3))-.5;
float radius=sqrt(r);float grainMask=smoothEdge>.5 && fieldShape<.5 ? 1.-smoothstep(.74,.93,radius) : 1.;color+=grain*grainAmount*grainMask;
float pixel=2./max(1.,min(resolution.x,resolution.y));
float alpha=fieldShape>.5 ? 1. : smoothEdge>.5 ? 1.-smoothstep(1.-pixel,1.,radius) : 1.-smoothstep(.985,1.,r);gl_FragColor=vec4(color,alpha);}`;

function rgb(hex: string) {
  return [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
}

/** Decorative, local GPU art. Animation stops offscreen, in hidden tabs, and for reduced motion. */
export default function ShaderOrb({
  tone = "orange",
  animated = false,
  className = "",
  shape = "sphere",
  edge = "textured",
}: {
  tone?: string;
  animated?: boolean;
  className?: string;
  shape?: "sphere" | "field";
  edge?: "textured" | "smooth";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = PALETTES[tone] ?? PALETTES.orange;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      shaders.push(shader);
      return shader;
    }
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    if (!vertex || !fragment || !program || !buffer) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      shaders.forEach((shader) => gl.deleteShader(shader));
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(gl.getUniformLocation(program, "lightColor"), rgb(colors[0]));
    gl.uniform3fv(gl.getUniformLocation(program, "midColor"), rgb(colors[1]));
    gl.uniform3fv(gl.getUniformLocation(program, "darkColor"), rgb(colors[2]));
    gl.uniform1f(
      gl.getUniformLocation(program, "grainAmount"),
      shape === "field" ? 0.075 : tone === "blue" ? 0.014 : 0.13,
    );
    gl.uniform1f(
      gl.getUniformLocation(program, "motionSpeed"),
      tone === "blue" ? 0.32 : 0.12,
    );
    gl.uniform1f(
      gl.getUniformLocation(program, "fieldShape"),
      shape === "field" ? 1 : 0,
    );
    gl.uniform1f(gl.getUniformLocation(program, "smoothEdge"), edge === "smooth" ? 1 : 0);
    const timeLocation = gl.getUniformLocation(program, "time");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last = 0,
      visible = false,
      disposed = false,
      elapsed = 0;
    function draw() {
      if (disposed || gl!.isContextLost()) return;
      gl!.uniform1f(timeLocation, elapsed / 1000);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      canvas!.style.opacity = "1";
    }
    function tick(now: number) {
      if (disposed) return;
      if (now - last >= (tone === "blue" ? 16 : 42)) {
        elapsed += last ? Math.min(now - last, 80) : 0;
        last = now;
        draw();
      }
      frame = window.requestAnimationFrame(tick);
    }
    function syncMotion() {
      window.cancelAnimationFrame(frame);
      last = 0;
      if (
        visible &&
        !document.hidden &&
        animated &&
        !reduced.matches &&
        !gl!.isContextLost()
      )
        frame = window.requestAnimationFrame(tick);
      else draw();
    }
    function resize() {
      const size = Math.max(
        1,
        Math.min(
          600,
          Math.round(
            canvas!.getBoundingClientRect().width *
              Math.min(window.devicePixelRatio, 1.5),
          ),
        ),
      );
      canvas!.width = size;
      canvas!.height = size;
      gl!.viewport(0, 0, size, size);
      gl!.uniform2f(resolutionLocation, size, size);
      draw();
    }
    function contextLost(event: Event) {
      event.preventDefault();
      window.cancelAnimationFrame(frame);
      canvas!.style.opacity = "0";
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      syncMotion();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", syncMotion);
    reduced.addEventListener("change", syncMotion);
    canvas.addEventListener("webglcontextlost", contextLost);
    resize();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", syncMotion);
      reduced.removeEventListener("change", syncMotion);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.style.opacity = "0";
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
    };
  }, [animated, colors, tone, shape, edge]);
  return (
    <span
      className={`${styles.shell} ${shape === "field" ? styles.field : ""} ${edge === "smooth" && shape === "sphere" ? styles.smooth : ""} ${className}`}
      style={
        {
          "--orb-light": colors[0],
          "--orb-mid": colors[1],
          "--orb-dark": colors[2],
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </span>
  );
}
