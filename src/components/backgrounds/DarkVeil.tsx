import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle, Vec2 } from 'ogl';
import './DarkVeil.css';

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uHueShift;
uniform float uNoise;
uniform float uScan;
uniform float uScanFreq;
uniform float uWarp;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotation = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotation * p;
    amplitude *= 0.5;
  }
  return value;
}

vec3 hueShiftRGB(vec3 color, float degrees) {
  const mat3 rgb2yiq = mat3(
    0.299, 0.587, 0.114,
    0.596, -0.274, -0.322,
    0.211, -0.523, 0.312
  );
  const mat3 yiq2rgb = mat3(
    1.0, 0.956, 0.621,
    1.0, -0.272, -0.647,
    1.0, -1.106, 1.703
  );

  vec3 yiq = rgb2yiq * color;
  float radiansShift = radians(degrees);
  float cosShift = cos(radiansShift);
  float sinShift = sin(radiansShift);
  vec3 shifted = vec3(
    yiq.x,
    yiq.y * cosShift - yiq.z * sinShift,
    yiq.y * sinShift + yiq.z * cosShift
  );
  return clamp(yiq2rgb * shifted, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float time = uTime * 0.52;

  vec2 waveA = vec2(
    sin(uv.y * 6.8 + time * 2.35),
    cos(uv.x * 5.9 - time * 1.95)
  );
  vec2 waveB = vec2(
    sin(uv.y * 11.0 - time * 3.35),
    cos(uv.x * 9.6 + time * 2.75)
  );
  uv += (waveA * 0.042 + waveB * 0.031) * uWarp;

  float veil = fbm(uv * 1.9 + vec2(time * 0.44, -time * 0.24));
  float swirl = fbm(uv * 3.8 + vec2(-time * 0.35, time * 0.41));
  float core = smoothstep(1.08, 0.02, length(uv * vec2(1.0, 0.78)));
  float band = 0.5 + 0.5 * sin(uv.y * 8.4 + veil * 4.0 - time * 4.2);
  band *= 0.42 + 0.58 * smoothstep(0.88, 0.04, abs(uv.x));
  float haze = smoothstep(0.82, 0.03, abs(uv.y + 0.16 * sin(time * 1.25)));
  float trail = smoothstep(0.72, 0.0, abs(sin(uv.x * 4.4 + time * 2.15) + 0.35 * sin(uv.y * 6.8 - time * 3.05)));

  vec3 color = vec3(0.004, 0.004, 0.006);
  color += vec3(0.04, 0.005, 0.008) * core * (0.45 + veil * 0.28);
  color += vec3(0.18, 0.016, 0.022) * band * (0.42 + veil * 0.26);
  color += vec3(0.48, 0.06, 0.06) * haze * (0.11 + swirl * 0.12);
  color += vec3(0.12, 0.01, 0.014) * trail * (0.16 + veil * 0.18);
  color += vec3(0.024, 0.012, 0.014) * fbm(uv * 7.0 - vec2(time * 0.12, time * 0.08));

  color = hueShiftRGB(color, uHueShift);

  color += (hash(gl_FragCoord.xy + uTime) - 0.5) * uNoise * 0.72;
  color *= 0.9;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

export interface DarkVeilProps {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  speed?: number;
  scanlineFrequency?: number;
  warpAmount?: number;
  resolutionScale?: number;
}

export default function DarkVeil({
  hueShift = 0,
  noiseIntensity = 0,
  scanlineIntensity = 0,
  speed = 0.5,
  scanlineFrequency = 0,
  warpAmount = 0,
  resolutionScale = 1,
}: DarkVeilProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;

    if (!canvas || !parent) {
      return undefined;
    }

    const renderer = new Renderer({
      canvas,
      dpr: Math.min(window.devicePixelRatio, 2),
    });

    const gl = renderer.gl;
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2() },
        uHueShift: { value: hueShift },
        uNoise: { value: noiseIntensity },
        uScan: { value: scanlineIntensity },
        uScanFreq: { value: scanlineFrequency },
        uWarp: { value: warpAmount },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const width = parent.clientWidth;
      const height = parent.clientHeight;

      renderer.setSize(width * resolutionScale, height * resolutionScale);
      program.uniforms.uResolution.value.set(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);
    window.addEventListener('resize', resize);
    resize();

    const startedAt = performance.now();
    let frame = 0;

    const loop = () => {
      program.uniforms.uTime.value = ((performance.now() - startedAt) / 1000) * speed;
      program.uniforms.uHueShift.value = hueShift;
      program.uniforms.uNoise.value = noiseIntensity;
      program.uniforms.uScan.value = scanlineIntensity;
      program.uniforms.uScanFreq.value = scanlineFrequency;
      program.uniforms.uWarp.value = warpAmount;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount, resolutionScale]);

  return <canvas ref={canvasRef} className="darkveil-canvas" aria-hidden="true" />;
}