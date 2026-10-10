// Small, local playgrounds with one shared, visibility-aware canvas clock.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const stopped = () => motion.matches || document.body.classList.contains('motion-paused');
  const palette = () => document.documentElement.dataset.theme === 'dark'
    ? ['#adc0ff', '#d2b4eb', '#a5ddd0'] : ['#849bdd', '#b397cd', '#7cb6a8'];
  const surfaces = [];
  let frame = 0;
  let lastFrame = 0;
  let sparks = [];
  let lastSpark = 0;
  let pipelineTimer = 0;
  let demoTimer = 0;
  const diagram = document.querySelector('.architecture-diagram');
  const nodes = [...diagram.querySelectorAll('.diagram-node')];
  const pipelineStatus = document.querySelector('.pipeline-status');
  const descriptions = [
    'Spark extraction — independent extraction prepares monthly and rolling data loads.',
    'Oracle DB — extracted data flows through database tables, materialized views, and packages.',
    'Kafka consumption — parallel consumers coordinate the event-driven processing.',
    'OpenSearch indexing — bulk workers turn the extracted data into searchable indexes.',
    'Safe alias promotion — validated indexes become available to APIs and workflows.'
  ];
  const selectNode = (index) => {
    nodes.forEach((node, i) => node.setAttribute('aria-pressed', String(i === index)));
    pipelineStatus.textContent = descriptions[index];
  };
  const finishPipeline = () => {
    clearTimeout(pipelineTimer);
    pipelineTimer = 0;
    selectNode(4);
    pipelineStatus.textContent = 'Sample complete — extracted, streamed, indexed, and safely promoted. Select any layer to explore it.';
    document.querySelector('.pipeline-demo').textContent = 'Run another event →';
  };
  nodes.forEach(node => { node.disabled = false; });
  nodes.forEach((node, index) => node.addEventListener('click', () => {
    clearTimeout(pipelineTimer);
    pipelineTimer = 0;
    selectNode(index);
  }));
  document.querySelector('.pipeline-demo').addEventListener('click', () => {
    clearTimeout(pipelineTimer);
    if (stopped()) { finishPipeline(); return; }
    let index = 0;
    const advance = () => {
      selectNode(index++);
      if (index < nodes.length) pipelineTimer = setTimeout(advance, 650);
      else pipelineTimer = setTimeout(finishPipeline, 650);
    };
    advance();
  });

  const wake = () => {
    if (!frame && !stopped() && !document.hidden && (sparks.length || surfaces.some(s => s.visible))) {
      frame = requestAnimationFrame(tick);
    }
  };
  const observeSurface = (element, canvas, paint) => {
    const context = canvas?.getContext('2d');
    if (!context) return;
    const surface = { element, canvas, context, paint, width:0, height:0, visible:false, points:[] };
    const resize = () => {
      const rect = element.getBoundingClientRect();
      surface.width = rect.width;
      surface.height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (element === diagram) {
        const vertical = getComputedStyle(element).flexDirection === 'column';
        surface.points = nodes.map(node => {
          const box = node.getBoundingClientRect();
          return vertical ? { x:rect.width - 15, y:box.top - rect.top + box.height / 2 }
            : { x:box.left - rect.left + box.width / 2, y:rect.height - 14 };
        });
      }
      context.clearRect(0, 0, rect.width, rect.height);
      wake();
    };
    surfaces.push(surface);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(element);
    else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
      surface.visible = entry.isIntersecting;
      element.classList.toggle('in-view', entry.isIntersecting);
      wake();
    }).observe(element);
    else { surface.visible = true; element.classList.add('in-view'); }
    resize();
  };
  observeSurface(document.querySelector('.visual-data'), document.querySelector('.art-canvas'), (s, time) => {
    const { context:c, width:w, height:h } = s;
    const accelerated = s.element.classList.contains('is-playing');
    for (let lane = 0; lane < 4; lane++) {
      const y = h * (.26 + lane * .12);
      c.strokeStyle = 'rgba(130,153,205,.12)';
      c.lineWidth = .7;
      c.beginPath(); c.moveTo(w * .08, y); c.lineTo(w * .92, y); c.stroke();
      for (let p = 0; p < 3; p++) {
        const x = w * (.08 + ((time * (accelerated ? .00027 : .00006) + p / 3 + lane * .16) % 1) * .84);
        c.fillStyle = palette()[lane % 3];
        c.globalAlpha = .4;
        c.fillRect(x, y - 1, 7, 2);
      }
    }
    c.globalAlpha = 1;
  });
  observeSurface(diagram, diagram.querySelector('canvas'), (s, time) => {
    const c = s.context;
    if (s.points.length < 2) return;
    c.strokeStyle = 'rgba(148,171,230,.15)'; c.lineWidth = 1;
    c.beginPath(); s.points.forEach((p, i) => i ? c.lineTo(p.x,p.y) : c.moveTo(p.x,p.y)); c.stroke();
    const position = (time * .0003) % (s.points.length - 1);
    const index = Math.floor(position);
    const t = position - index;
    const a = s.points[index], b = s.points[index + 1];
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    c.fillStyle = '#a8bfff'; c.shadowColor = '#8faaff'; c.shadowBlur = 9;
    c.beginPath(); c.arc(x,y,2.5,0,Math.PI*2); c.fill(); c.shadowBlur = 0;
  });

  document.querySelectorAll('.data-bars i').forEach((bar,index) => bar.style.setProperty('--bar-index',index));
  document.querySelectorAll('.visual-ml, .visual-ai').forEach(visual => {
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => visual.classList.toggle('in-view',entry.isIntersecting)).observe(visual);
    else visual.classList.add('in-view');
    visual.addEventListener('pointermove', event => {
      if (stopped() || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = visual.getBoundingClientRect();
      visual.style.setProperty('--art-x', `${(event.clientX - rect.left - rect.width / 2) * .035}px`);
      visual.style.setProperty('--art-y', `${(event.clientY - rect.top - rect.height / 2) * .035}px`);
    }, { passive:true });
    visual.addEventListener('pointerleave', () => {
      visual.style.setProperty('--art-x','0px'); visual.style.setProperty('--art-y','0px');
    });
  });
  document.querySelector('.data-demo').addEventListener('click', () => {
    const visual = document.querySelector('.visual-data');
    const caption = visual.querySelector('.visual-caption');
    caption.textContent = 'SAMPLE EVENT → INDEXED';
    clearTimeout(demoTimer);
    if (!stopped()) {
      visual.classList.add('is-playing');
      demoTimer = setTimeout(() => { visual.classList.remove('is-playing'); caption.textContent = 'EVENT → INSIGHT'; }, 1800);
    }
  });
  const signals = ['Usage pattern → Review extension options', 'Plan eligibility → Check permitted options', 'Recommendation → Human review'];
  let signalIndex = 0;
  document.querySelector('.ml-demo').addEventListener('click', () => {
    document.querySelector('.ml-status').textContent = signals[signalIndex++ % signals.length];
    const visual = document.querySelector('.visual-ml');
    visual.classList.remove('is-playing');
    if (!stopped()) { void visual.offsetWidth; visual.classList.add('is-playing'); }
  });
  const intents = [['Find a plan','Search workflow ready'],['Create an opportunity','Opportunity workflow ready'],['Generate a URL','URL workflow ready']];
  let intentIndex = 0;
  document.querySelector('.ai-demo').addEventListener('click', () => {
    const [intent,result] = intents[intentIndex++ % intents.length];
    document.querySelector('.visual-ai .chat-bubble').textContent = intent + ' ✦';
    document.querySelector('.ai-status').textContent = result;
  });

  const cursorCanvas = document.querySelector('.cursor-fx');
  const cursorContext = cursorCanvas.getContext('2d');
  const resizeCursor = () => {
    if (!cursorContext) return;
    const ratio = Math.min(devicePixelRatio || 1,2);
    cursorCanvas.width = Math.round(innerWidth * ratio);
    cursorCanvas.height = Math.round(innerHeight * ratio);
    cursorContext.setTransform(ratio,0,0,ratio,0,0);
  };
  resizeCursor(); window.addEventListener('resize',resizeCursor);
  const addSparks = (x,y,count,burst) => {
    if (!cursorContext || stopped()) return;
    const now = performance.now();
    for (let i=0;i<count;i++) {
      const angle = Math.random()*Math.PI*2;
      const speed = burst ? 20+Math.random()*60 : 8;
      sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed, born:now,
        life:burst ? 650 : 400, size:burst ? 2+Math.random()*2 : 1.4, color:palette()[i%3], burst});
    }
    sparks = sparks.slice(-80); wake();
  };
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType === 'touch' || stopped()) return;
    const now = performance.now();
    if (now-lastSpark < 65 || event.target.closest('p,h1,h2,h3,nav,.site-header')) return;
    lastSpark=now; addSparks(event.clientX,event.clientY,2,false);
  }, {passive:true});
  document.addEventListener('click',event => {
    if (event.target.closest('a,summary,.site-header,.motion-toggle') || stopped()) return;
    const rect = event.target.closest('.demo-button,.diagram-node')?.getBoundingClientRect();
    const x = event.detail === 0 && rect ? rect.left+rect.width/2 : event.clientX;
    const y = event.detail === 0 && rect ? rect.top+rect.height/2 : event.clientY;
    addSparks(x,y,10,true);
  });
  function tick(time) {
    frame=0;
    if (stopped() || document.hidden) return;
    if (time-lastFrame >= 32) {
      lastFrame=time;
      surfaces.forEach(s => { if (s.visible) { s.context.clearRect(0,0,s.width,s.height); s.paint(s,time); } });
      if (cursorContext) {
        cursorContext.clearRect(0,0,innerWidth,innerHeight);
        sparks=sparks.filter(p=>time-p.born<p.life);
        sparks.forEach(p => {
          const age=(time-p.born)/1000;
          cursorContext.globalAlpha=(1-(time-p.born)/p.life)*.65;
          cursorContext.fillStyle=p.color;
          const x=p.x+p.vx*age, y=p.y+p.vy*age+(p.burst?50*age*age:0);
          cursorContext.save(); cursorContext.translate(x,y); cursorContext.rotate(age*3);
          cursorContext.fillRect(-p.size/2,-p.size/2,p.size,p.burst?p.size*.5:p.size);
          cursorContext.restore();
        });
        cursorContext.globalAlpha=1;
      }
    }
    wake();
  }
  const sync = () => {
    if (frame) cancelAnimationFrame(frame);
    frame=0;
    if (stopped() || document.hidden) {
      sparks=[]; cursorContext?.clearRect(0,0,innerWidth,innerHeight);
      surfaces.forEach(s=>s.context.clearRect(0,0,s.width,s.height));
      document.querySelectorAll('.project-visual').forEach(visual => {
        visual.style.setProperty('--art-x','0px'); visual.style.setProperty('--art-y','0px');
      });
      if (pipelineTimer) finishPipeline();
    } else wake();
  };
  motion.addEventListener('change',sync);
  window.addEventListener('motionchange',sync);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('themechange',() => {
    surfaces.forEach(s=>s.context.clearRect(0,0,s.width,s.height)); wake();
  });
  document.body.classList.add('effects-ready');
  wake();
})();
