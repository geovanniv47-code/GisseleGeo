(() => {
  const canvas = document.querySelector('.starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [], width = 0, height = 0, frame = 0;
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth; height = innerHeight;
    canvas.width = width * ratio; canvas.height = height * ratio;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(130, Math.floor((width * height) / 10000));
    stars = Array.from({ length: count }, () => ({ x: Math.random()*width, y: Math.random()*height, r: Math.random()*1.25+.25, v: Math.random()*.08+.02, a: Math.random()*.65+.2 }));
  };
  const draw = () => {
    ctx.clearRect(0,0,width,height);
    for (const star of stars) {
      star.y -= star.v; if (star.y < -2) star.y = height + 2;
      const pulse = reduceMotion ? 1 : .75 + Math.sin(frame*.015 + star.x)*.25;
      ctx.beginPath(); ctx.fillStyle = `rgba(200,235,255,${star.a*pulse})`; ctx.arc(star.x,star.y,star.r,0,Math.PI*2); ctx.fill();
    }
    frame++; if (!reduceMotion) requestAnimationFrame(draw);
  };
  addEventListener('resize', resize, { passive:true }); resize(); draw();
})();
