import * as THREE from 'three';

function drawRoundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function createCardTexture({ title, subtitle = '', maxAniso = 4 }) {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const pad = 12;
  const r = 34;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, 'rgba(255, 253, 248, 0.95)');
  grad.addColorStop(1, 'rgba(243, 235, 218, 0.9)');

  drawRoundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, r);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(182, 131, 47, 0.65)';
  ctx.stroke();

  // Inner emerald accent dot
  ctx.beginPath();
  ctx.arc(pad + 34, pad + 34, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#0e4d3a';
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0e4d3a';
  ctx.font = '700 48px Georgia, serif';
  ctx.fillText(title, width / 2, height * 0.42);

  if (subtitle) {
    ctx.fillStyle = '#9a6b20';
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(subtitle, width / 2, height * 0.68);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, maxAniso);
  return texture;
}

export function initScene3D(canvas) {
  if (!canvas) {
    return { destroy: () => {} };
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return { destroy: () => {} };
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 7.2);

  // Subtle floating emerald ambient dust
  const dustCount = 180;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 14;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1.5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x145a44,
    size: 0.032,
    transparent: true,
    opacity: 0.3,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  // Vocabulary & Idiom Cards + Acoustic Speaking Wave Rings
  const cardsGroup = new THREE.Group();
  scene.add(cardsGroup);

  const acousticRings = [];
  for (let i = 0; i < 5; i++) {
    const rMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xb6832f : 0x0e4d3a,
      transparent: true,
      opacity: 0.22,
    });
    const rMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.1 + i * 0.48, 0.012, 12, 96),
      rMat
    );
    rMesh.position.set(0, 0, -0.9 - i * 0.2);
    rMesh.userData = { phase: i * 1.15 };
    cardsGroup.add(rMesh);
    acousticRings.push(rMesh);
  }

  const cardSpecs = [
    { title: 'Fluency', subtitle: '/ˈfluː.ən.si/', pos: [-1.45, 1.45, 0.45], rot: [0.06, 0.22, -0.04], scale: 1.02 },
    { title: 'Confidence', subtitle: 'Speak naturally', pos: [1.55, 1.25, -0.25], rot: [-0.04, -0.28, 0.05], scale: 0.98 },
    { title: 'Break the ice', subtitle: 'Idiom · C1', pos: [-1.65, -0.15, -0.35], rot: [0.05, 0.3, 0.03], scale: 0.92 },
    { title: 'Piece of cake', subtitle: 'Idiom · B1', pos: [1.45, -0.25, 0.5], rot: [-0.05, -0.18, -0.05], scale: 0.95 },
    { title: 'Think on your feet', subtitle: 'Speaking Lab', pos: [-0.05, 1.95, -0.8], rot: [0.1, 0.05, 0.02], scale: 0.92 },
    { title: 'Articulate', subtitle: '/ɑːrˈtɪk.jə.lət/', pos: [0.1, -1.65, 0.3], rot: [-0.08, -0.1, 0.04], scale: 0.96 },
    { title: 'A1 → C1', subtitle: '100% Live Online', pos: [-1.25, -1.45, -0.6], rot: [-0.05, 0.24, -0.06], scale: 0.88 },
    { title: 'USA ↔ TR', subtitle: 'Authentic Accent', pos: [1.55, -1.45, -0.75], rot: [0.04, -0.25, 0.03], scale: 0.88 },
    { title: "Let's talk!", subtitle: 'Teacher Eda', pos: [0.05, 0.25, -0.1], rot: [0.02, -0.08, 0.02], scale: 1.06 },
  ];

  const cardPlaneGeo = new THREE.PlaneGeometry(1.36, 0.68);
  const cardEdgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.42, 0.74));
  const cardEdgeMat = new THREE.LineBasicMaterial({
    color: 0xb6832f,
    transparent: true,
    opacity: 0.42,
  });

  const floatingCards = cardSpecs.map((spec, idx) => {
    const tex = createCardTexture({
      title: spec.title,
      subtitle: spec.subtitle,
      maxAniso,
    });
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
    });
    const holder = new THREE.Group();
    const front = new THREE.Mesh(cardPlaneGeo, mat);
    const frame = new THREE.LineSegments(cardEdgeGeo, cardEdgeMat);
    frame.position.z = -0.025;
    holder.add(front, frame);

    holder.position.set(...spec.pos);
    holder.rotation.set(...spec.rot);
    holder.scale.setScalar(spec.scale);
    holder.userData = {
      basePos: new THREE.Vector3(...spec.pos),
      baseRot: new THREE.Euler(...spec.rot),
      phase: idx * 0.85,
      speed: 0.75 + (idx % 3) * 0.16,
    };
    cardsGroup.add(holder);
    return holder;
  });

  let pointerX = 0;
  let pointerY = 0;
  let smoothPointerX = 0;
  let smoothPointerY = 0;
  let scrollProgress = 0;
  let smoothScroll = 0;

  const onPointerMove = (e) => {
    pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  const onScroll = () => {
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  onScroll();

  const clock = new THREE.Clock();
  let rafId = 0;

  const animate = () => {
    rafId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const speedFactor = reducedMotion ? 0.15 : 1;

    smoothPointerX += (pointerX - smoothPointerX) * 0.055;
    smoothPointerY += (pointerY - smoothPointerY) * 0.055;
    smoothScroll += (scrollProgress - smoothScroll) * 0.06;

    const isDesktop = window.innerWidth >= 960;
    const heroOffsetX = isDesktop ? 1.85 : 0;
    const baseX = heroOffsetX * (1 - Math.min(1, smoothScroll * 2.1));
    const baseY = -smoothScroll * 0.45;
    const baseZ = -smoothScroll * 1.9;

    cardsGroup.position.set(
      baseX + smoothPointerX * 0.2,
      baseY + smoothPointerY * 0.15,
      baseZ
    );
    cardsGroup.rotation.y = smoothPointerX * 0.24 + Math.sin(elapsed * 0.25) * 0.06;
    cardsGroup.rotation.x = -smoothPointerY * 0.14;

    acousticRings.forEach((ring, idx) => {
      const wave = (elapsed * 0.32 * speedFactor + idx * 0.2) % 1;
      ring.scale.setScalar(0.72 + wave * 0.75);
      ring.material.opacity = Math.sin(wave * Math.PI) * 0.28;
      ring.rotation.z = elapsed * 0.08 * (idx % 2 === 0 ? 1 : -1) * speedFactor;
    });

    floatingCards.forEach((card) => {
      const { basePos, baseRot, phase, speed } = card.userData;
      card.position.y =
        basePos.y + Math.sin(elapsed * speed * speedFactor + phase) * 0.16;
      card.position.x =
        basePos.x + Math.cos(elapsed * speed * 0.6 * speedFactor + phase) * 0.06;
      card.rotation.y =
        baseRot.y + Math.sin(elapsed * 0.5 * speedFactor + phase) * 0.09 + smoothPointerX * 0.12;
      card.rotation.x = baseRot.x - smoothPointerY * 0.08;
    });

    dustPoints.rotation.y = elapsed * 0.02 * speedFactor + smoothPointerX * 0.05;
    dustPoints.rotation.x = smoothPointerY * 0.04;

    renderer.render(scene, camera);
  };

  animate();

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
